// src/services/tmdb.js
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE } from '../config';

const CACHE_KEY = 'cinefy_tmdb_cache_v2';

const GENRE_ID_MAP = {
  'Action': 28,
  'Adventure': 12,
  'Animation': 16,
  'Comedy': 35,
  'Crime': 80,
  'Documentary': 99,
  'Drama': 18,
  'Family': 10751,
  'Fantasy': 14,
  'History': 36,
  'Horror': 27,
  'Music': 10402,
  'Mystery': 9648,
  'Romance': 10749,
  'Science Fiction': 878,
  'Sci-Fi': 878,
  'Thriller': 53,
  'War': 10752,
  'Western': 37
};

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded or private mode
  }
}

export async function searchTMDbMovies(query) {
  if (!query || !query.trim() || !TMDB_API_KEY) return [];

  const cacheKey = `search_${query.trim().toLowerCase()}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query.trim())}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
    const results = (data.results || []).slice(0, 8).map(m => ({
      id: m.id,
      title: m.title || m.original_title || 'Unknown Film',
      year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
      releaseDate: m.release_date || '',
      overview: m.overview || 'No synopsis available.',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : null
    }));

    cache[cacheKey] = results;
    setCache(cache);
    return results;
  } catch (err) {
    console.error('TMDb Search Error:', err);
    return [];
  }
}

export async function fetchMovieMetadataByName(name, year) {
  if (!name || !TMDB_API_KEY) {
    return { director: '', genre: 'Cinema', genres: ['Cinema'], overview: '', poster: null, backdrop: null, runtime: 110, tagline: '', voteAverage: 0, voteCount: 0, cast: [] };
  }

  const cleanName = name.trim().toLowerCase();
  const cacheKey = `dossier_meta_${cleanName}_${year || ''}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name.trim())}`;
    if (year) url += `&year=${year}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    const firstMatch = (data.results || [])[0];
    if (!firstMatch) {
      return { director: '', genre: 'Cinema', genres: ['Cinema'], overview: '', poster: null, backdrop: null, runtime: 110, tagline: '', voteAverage: 0, voteCount: 0, cast: [] };
    }

    const detailUrl = `${TMDB_BASE_URL}/movie/${firstMatch.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const crew = detailData.credits?.crew || [];
    const directors = crew.filter(c => c.job === 'Director').map(c => c.name);
    const director = directors.length > 0 ? directors.join(', ') : '';
    const genreList = (detailData.genres || []).map(g => g.name);
    const genres = genreList.join(', ') || 'Cinema';
    const poster = detailData.poster_path ? `${TMDB_IMAGE_BASE}${detailData.poster_path}` : (firstMatch.poster_path ? `${TMDB_IMAGE_BASE}${firstMatch.poster_path}` : null);
    const backdrop = detailData.backdrop_path ? `${TMDB_IMAGE_BASE}${detailData.backdrop_path}` : (firstMatch.backdrop_path ? `${TMDB_IMAGE_BASE}${firstMatch.backdrop_path}` : null);
    const runtime = detailData.runtime || 110;
    const cast = (detailData.credits?.cast || []).slice(0, 8).map(c => c.name);
    const tagline = detailData.tagline || '';
    const voteAverage = detailData.vote_average ? Number(detailData.vote_average.toFixed(1)) : (firstMatch.vote_average ? Number(firstMatch.vote_average.toFixed(1)) : 0);
    const voteCount = detailData.vote_count || firstMatch.vote_count || 0;

    const result = {
      tmdbId: firstMatch.id,
      title: detailData.title || firstMatch.title || name,
      year: detailData.release_date ? parseInt(detailData.release_date.split('-')[0], 10) : year,
      director,
      genre: genres,
      genres: genreList.length > 0 ? genreList : ['Cinema'],
      overview: detailData.overview || firstMatch.overview || '',
      tagline,
      poster,
      backdrop,
      runtime,
      voteAverage,
      voteCount,
      cast
    };

    cache[cacheKey] = result;
    setCache(cache);
    return result;
  } catch (err) {
    console.warn('TMDb metadata fetch failed:', err);
    return { director: '', genre: 'Cinema', genres: ['Cinema'], overview: '', poster: null, backdrop: null, runtime: 110, tagline: '', voteAverage: 0, voteCount: 0, cast: [] };
  }
}

export async function fetchMovieDetailsById(tmdbId) {
  if (!tmdbId || !TMDB_API_KEY) return null;
  const cacheKey = `dossier_id_${tmdbId}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const detailUrl = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const res = await fetch(detailUrl);
    if (!res.ok) return null;
    const detailData = await res.json();

    const crew = detailData.credits?.crew || [];
    const directors = crew.filter(c => c.job === 'Director').map(c => c.name);
    const director = directors.length > 0 ? directors.join(', ') : '';
    const genreList = (detailData.genres || []).map(g => g.name);
    const poster = detailData.poster_path ? `${TMDB_IMAGE_BASE}${detailData.poster_path}` : null;
    const backdrop = detailData.backdrop_path ? `${TMDB_IMAGE_BASE}${detailData.backdrop_path}` : null;
    const cast = (detailData.credits?.cast || []).slice(0, 8).map(c => c.name);

    const result = {
      tmdbId: detailData.id,
      title: detailData.title || detailData.original_title,
      year: detailData.release_date ? parseInt(detailData.release_date.split('-')[0], 10) : null,
      director,
      genre: genreList.join(', ') || 'Cinema',
      genres: genreList.length > 0 ? genreList : ['Cinema'],
      overview: detailData.overview || '',
      tagline: detailData.tagline || '',
      poster,
      backdrop,
      runtime: detailData.runtime || 110,
      voteAverage: detailData.vote_average ? Number(detailData.vote_average.toFixed(1)) : 0,
      voteCount: detailData.vote_count || 0,
      cast
    };

    cache[cacheKey] = result;
    setCache(cache);
    return result;
  } catch (err) {
    console.error('TMDb ID fetch error:', err);
    return null;
  }
}

export async function fetchDiscoverByGenre(genreName) {
  return fetchMoviesByGenreName(genreName);
}

export async function fetchMoviesByGenreName(genreName) {
  if (!TMDB_API_KEY || !genreName) return [];
  const genreId = GENRE_ID_MAP[genreName] || 18;
  const cacheKey = `discover_genre_${genreId}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=120&page=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const results = (data.results || []).slice(0, 24).map(m => ({
      id: m.id,
      tmdbId: m.id,
      name: m.title || m.original_title,
      title: m.title || m.original_title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null,
      director: '',
      genre: genreName,
      overview: m.overview || '',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteAverage: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : null,
      runtime: 115
    }));

    cache[cacheKey] = results;
    setCache(cache);
    return results;
  } catch (err) {
    console.error('fetchMoviesByGenreName error:', err);
    return [];
  }
}

export async function fetchMoviesByYear(year) {
  if (!TMDB_API_KEY || !year) return [];
  const yearNum = parseInt(year, 10);
  if (!yearNum || isNaN(yearNum)) return [];

  const cacheKey = `discover_year_${yearNum}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${yearNum}&sort_by=popularity.desc&vote_count.gte=80&page=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const results = (data.results || []).slice(0, 24).map(m => ({
      id: m.id,
      tmdbId: m.id,
      name: m.title || m.original_title,
      title: m.title || m.original_title,
      year: yearNum,
      director: '',
      genre: 'Cinema',
      overview: m.overview || '',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteAverage: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : null,
      runtime: 115
    }));

    cache[cacheKey] = results;
    setCache(cache);
    return results;
  } catch (err) {
    console.error('fetchMoviesByYear error:', err);
    return [];
  }
}

export async function fetchPersonFilmography(name, preferredRole = '') {
  if (!TMDB_API_KEY || !name || !name.trim()) {
    return { person: null, movies: [] };
  }

  const cleanName = name.trim().toLowerCase();
  const cacheKey = `person_filmography_${cleanName}_${preferredRole}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    // 1. Search for Person
    const searchUrl = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name.trim())}&include_adult=false`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return { person: null, movies: [] };
    const searchData = await searchRes.json();
    const firstPerson = (searchData.results || [])[0];
    if (!firstPerson) return { person: null, movies: [] };

    // 2. Fetch Full Person Details + Movie Credits
    const detailUrl = `${TMDB_BASE_URL}/person/${firstPerson.id}?api_key=${TMDB_API_KEY}&append_to_response=movie_credits`;
    const detailRes = await fetch(detailUrl);
    if (!detailRes.ok) return { person: null, movies: [] };
    const detailData = await detailRes.json();

    const personInfo = {
      id: detailData.id,
      name: detailData.name || firstPerson.name,
      biography: detailData.biography || '',
      knownForDepartment: detailData.known_for_department || firstPerson.known_for_department || 'Acting',
      birthday: detailData.birthday || '',
      placeOfBirth: detailData.place_of_birth || '',
      profileUrl: detailData.profile_path ? `${TMDB_IMAGE_BASE}${detailData.profile_path}` : (firstPerson.profile_path ? `${TMDB_IMAGE_BASE}${firstPerson.profile_path}` : null)
    };

    const credits = detailData.movie_credits || {};
    let rawMovies = [];

    const isDirectorRole = preferredRole === 'Director' || personInfo.knownForDepartment === 'Directing';
    if (isDirectorRole && credits.crew) {
      const directingCrew = credits.crew.filter(c => c.job === 'Director');
      if (directingCrew.length > 0) {
        rawMovies = directingCrew;
      } else {
        rawMovies = [...(credits.cast || []), ...(credits.crew || [])];
      }
    } else {
      rawMovies = credits.cast && credits.cast.length > 0 ? credits.cast : (credits.crew || []);
    }

    // Deduplicate by Movie ID
    const seenMovieIds = new Set();
    const uniqueMovies = [];
    for (const m of rawMovies) {
      if (!seenMovieIds.has(m.id)) {
        seenMovieIds.add(m.id);
        uniqueMovies.push(m);
      }
    }

    // Sort by popularity and vote count
    uniqueMovies.sort((a, b) => {
      const popA = (a.popularity || 0) * (a.vote_count || 1);
      const popB = (b.popularity || 0) * (b.vote_count || 1);
      return popB - popA;
    });

    const movies = uniqueMovies.slice(0, 32).map(m => ({
      id: m.id,
      tmdbId: m.id,
      name: m.title || m.original_title,
      title: m.title || m.original_title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null,
      director: isDirectorRole ? personInfo.name : '',
      genre: 'Cinema',
      overview: m.overview || '',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteAverage: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      character: m.character || '',
      job: m.job || (isDirectorRole ? 'Director' : 'Actor'),
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : null,
      runtime: 115
    }));

    const result = { person: personInfo, movies };
    cache[cacheKey] = result;
    setCache(cache);
    return result;
  } catch (err) {
    console.error('fetchPersonFilmography error:', err);
    return { person: null, movies: [] };
  }
}

export async function fetchSimilarMovies(tmdbId, movieName = '', year = null) {
  if (!TMDB_API_KEY) return [];

  let targetId = tmdbId;
  if (!targetId && movieName) {
    const meta = await fetchMovieMetadataByName(movieName, year);
    targetId = meta?.tmdbId;
  }

  if (!targetId) return [];

  const cacheKey = `similar_movies_${targetId}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    // Try recommendations first, fallback to similar
    let url = `${TMDB_BASE_URL}/movie/${targetId}/recommendations?api_key=${TMDB_API_KEY}&page=1`;
    let res = await fetch(url);
    let data = res.ok ? await res.json() : null;

    if (!data || !data.results || data.results.length === 0) {
      url = `${TMDB_BASE_URL}/movie/${targetId}/similar?api_key=${TMDB_API_KEY}&page=1`;
      res = await fetch(url);
      data = res.ok ? await res.json() : null;
    }

    if (!data || !data.results) return [];

    const results = (data.results || []).slice(0, 12).map(m => ({
      id: m.id,
      tmdbId: m.id,
      name: m.title || m.original_title,
      title: m.title || m.original_title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null,
      director: '',
      genre: 'Cinema',
      overview: m.overview || '',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteAverage: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : null,
      runtime: 115
    }));

    cache[cacheKey] = results;
    setCache(cache);
    return results;
  } catch (err) {
    console.error('fetchSimilarMovies error:', err);
    return [];
  }
}
