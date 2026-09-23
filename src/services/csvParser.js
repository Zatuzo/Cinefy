// src/services/csvParser.js
import { fetchMovieMetadataByName } from './tmdb';

export function parseCSVText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Find header line
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('name') || lower.includes('watched date') || lower.includes('rating') || lower.includes('uri')) {
      headerIndex = i;
      break;
    }
  }

  const rawHeaders = splitCSVLine(lines[headerIndex]);
  const headers = rawHeaders.map(h => h.trim());

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length >= headers.length - 2) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
      });
      rows.push(obj);
    }
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function processLetterboxdFiles(files, onProgress) {
  const fileDataMap = {};

  for (const file of files) {
    const text = await file.text();
    const rows = parseCSVText(text);
    const lowerName = file.name.toLowerCase();

    if (lowerName.includes('diary')) {
      fileDataMap['diary'] = rows;
    } else if (lowerName.includes('rating')) {
      fileDataMap['ratings'] = rows;
    } else if (lowerName.includes('review')) {
      fileDataMap['reviews'] = rows;
    } else if (lowerName.includes('watchlist')) {
      fileDataMap['watchlist'] = rows;
    } else {
      fileDataMap[lowerName] = rows;
    }
  }

  // 1. Build Review & Rating Lookup Maps from reviews.csv and ratings.csv
  const reviewsMap = new Map();
  const rawReviews = fileDataMap['reviews'] || [];
  rawReviews.forEach(r => {
    const name = (r['Name'] || r['name'] || r['Title'] || '').trim().toLowerCase();
    const year = r['Year'] || r['year'] || '';
    const date = r['Watched Date'] || r['Date'] || '';
    const uri = r['Letterboxd URI'] || r['URI'] || '';
    const reviewText = r['Review'] || r['review'] || '';

    if (name && reviewText) {
      if (uri) reviewsMap.set(uri, reviewText);
      if (date) reviewsMap.set(`${name}_${year}_${date}`, reviewText);
      if (year) reviewsMap.set(`${name}_${year}`, reviewText);
      if (!reviewsMap.has(name)) reviewsMap.set(name, reviewText);
    }
  });

  const ratingsMap = new Map();
  const rawRatings = fileDataMap['ratings'] || [];
  rawRatings.forEach(r => {
    const name = (r['Name'] || r['name'] || r['Title'] || '').trim().toLowerCase();
    const year = r['Year'] || r['year'] || '';
    const uri = r['Letterboxd URI'] || r['URI'] || '';
    const ratingVal = parseFloat(r['Rating'] || r['rating']);

    if (name && !isNaN(ratingVal)) {
      if (uri) ratingsMap.set(uri, ratingVal);
      if (year) ratingsMap.set(`${name}_${year}`, ratingVal);
      if (!ratingsMap.has(name)) ratingsMap.set(name, ratingVal);
    }
  });

  // 2. Base diary entries from diary.csv (or ratings.csv / reviews.csv if diary is omitted)
  const baseRows = fileDataMap['diary'] || fileDataMap['reviews'] || fileDataMap['ratings'] || [];
  if (baseRows.length === 0 && !fileDataMap['watchlist']) {
    return { diary: [], watchlist: [] };
  }

  // Track existing keys to add non-diary review/rating rows
  const seenEntries = new Set();

  const diary = baseRows.map((row, i) => {
    const name = (row['Name'] || row['name'] || row['Title'] || 'Untitled').trim();
    const cleanName = name.toLowerCase();
    const year = parseInt(row['Year'] || row['year'], 10) || null;
    const dateStr = row['Watched Date'] || row['Date'] || '';
    const uri = row['Letterboxd URI'] || row['URI'] || '';
    const entryKey = `${cleanName}_${year || ''}_${dateStr}`;
    seenEntries.add(entryKey);
    seenEntries.add(`${cleanName}_${year || ''}`);

    let date = null;
    let monthYear = 'Undated';
    let dayOfWeek = 'N/A';

    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        date = dateStr;
        monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    // Resolve rating
    let rating = parseFloat(row['Rating'] || row['rating']);
    if (isNaN(rating)) {
      rating = ratingsMap.get(uri) || ratingsMap.get(`${cleanName}_${year}`) || ratingsMap.get(cleanName) || null;
    }

    // Resolve review text (from row itself or reviewsMap)
    let review = row['Review'] || row['review'] || '';
    if (!review) {
      review = (uri && reviewsMap.get(uri)) ||
               (dateStr && reviewsMap.get(`${cleanName}_${year}_${dateStr}`)) ||
               (year && reviewsMap.get(`${cleanName}_${year}`)) ||
               reviewsMap.get(cleanName) || '';
    }

    const decade = year ? `${Math.floor(year / 10) * 10}s` : 'N/A';
    const rewatch = row['Rewatch'] === 'Yes' || row['Rewatch'] === 'true' || row['rewatch'] === true;

    return {
      id: `csv_log_${i + 1}_${Date.now()}`,
      name,
      year,
      date,
      monthYear,
      dayOfWeek,
      rating: rating || null,
      decade,
      rewatch,
      director: row['Director'] || '',
      genre: row['Genres'] || row['Genre'] || '',
      overview: row['Overview'] || '',
      poster: null,
      runtime: 115,
      review
    };
  });

  // If reviews.csv has reviews for films not listed in diary.csv, add them
  if (fileDataMap['reviews'] && fileDataMap['diary']) {
    fileDataMap['reviews'].forEach((r, idx) => {
      const name = (r['Name'] || r['name'] || r['Title'] || 'Untitled').trim();
      const cleanName = name.toLowerCase();
      const year = parseInt(r['Year'] || r['year'], 10) || null;
      const dateStr = r['Watched Date'] || r['Date'] || '';
      const entryKey = `${cleanName}_${year || ''}_${dateStr}`;

      if (!seenEntries.has(entryKey) && !seenEntries.has(`${cleanName}_${year || ''}`)) {
        seenEntries.add(entryKey);
        let date = null;
        let monthYear = 'Undated';
        let dayOfWeek = 'N/A';
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            date = dateStr;
            monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
          }
        }
        diary.push({
          id: `rev_log_${idx + 1}_${Date.now()}`,
          name,
          year,
          date,
          monthYear,
          dayOfWeek,
          rating: parseFloat(r['Rating'] || r['rating']) || null,
          decade: year ? `${Math.floor(year / 10) * 10}s` : 'N/A',
          rewatch: false,
          director: r['Director'] || '',
          genre: r['Genres'] || r['Genre'] || '',
          overview: '',
          poster: null,
          runtime: 115,
          review: r['Review'] || r['review'] || ''
        });
      }
    });
  }

  // Sort diary chronologically descending (newest watched dates first)
  diary.sort((a, b) => {
    const da = new Date(a.date || 0);
    const db = new Date(b.date || 0);
    return db - da;
  });

  // 3. Instant Watchlist Parsing
  const rawWatch = fileDataMap['watchlist'] || [];
  const watchlist = rawWatch.map((row, i) => {
    const name = (row['Name'] || row['name'] || row['Title'] || 'Untitled').trim();
    const year = parseInt(row['Year'] || row['year'], 10) || null;

    return {
      id: `watch_${i + 1}_${Date.now()}`,
      name,
      year,
      director: row['Director'] || '',
      genre: row['Genres'] || row['Genre'] || '',
      overview: row['Overview'] || '',
      poster: null
    };
  });

  if (onProgress) onProgress(60);

  // 4. Fast Parallel Enrichment for initial films so UI is instantly rich
  const enrichCount = Math.min(diary.length, 24);
  const enrichPromises = [];

  for (let i = 0; i < enrichCount; i++) {
    enrichPromises.push(
      fetchMovieMetadataByName(diary[i].name, diary[i].year).then(meta => {
        if (meta) {
          diary[i].director = meta.director || diary[i].director;
          diary[i].genre = meta.genre || diary[i].genre || 'Cinema';
          diary[i].overview = meta.overview || diary[i].overview;
          diary[i].poster = meta.poster;
          diary[i].runtime = meta.runtime || 115;
        }
      }).catch(() => {})
    );
  }

  // Enrich first 16 watchlist items in parallel
  const watchEnrichCount = Math.min(watchlist.length, 16);
  for (let i = 0; i < watchEnrichCount; i++) {
    enrichPromises.push(
      fetchMovieMetadataByName(watchlist[i].name, watchlist[i].year).then(meta => {
        if (meta) {
          watchlist[i].director = meta.director || watchlist[i].director;
          watchlist[i].genre = meta.genre || watchlist[i].genre || 'Cinema';
          watchlist[i].overview = meta.overview || watchlist[i].overview;
          watchlist[i].poster = meta.poster;
          watchlist[i].backdrop = meta.backdrop;
        }
      }).catch(() => {})
    );
  }

  await Promise.allSettled(enrichPromises);

  if (onProgress) onProgress(100);

  return { diary, watchlist };
}
