// src/services/semanticSearch.js

export function searchWatchlistByVibe(watchlist = [], query = '') {
  if (!watchlist || watchlist.length === 0 || !query || !query.trim()) {
    return [];
  }

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  // Compute term frequencies and score
  const scored = watchlist
    .map(movie => {
      const title = movie.name || movie.title || movie.Name || '';
      const docText = `${title} ${movie.genre || movie.Genre || ''} ${movie.overview || movie.Overview || ''} ${movie.director || movie.Director || ''}`;
      const docTerms = tokenize(docText);
      const docTermMap = {};

      docTerms.forEach(t => {
        docTermMap[t] = (docTermMap[t] || 0) + 1;
      });

      let matchCount = 0;
      queryTerms.forEach(qt => {
        if (docTermMap[qt]) {
          matchCount += docTermMap[qt] * 2; // boost direct hits
        } else {
          // partial substring match
          for (const dt of Object.keys(docTermMap)) {
            if (dt.includes(qt) || qt.includes(dt)) {
              matchCount += 0.8;
              break;
            }
          }
        }
      });

      if (matchCount === 0) return null;

      // Score normalized to 0 - 100%
      const score = Math.min(99.5, Math.round((matchCount / Math.max(1, queryTerms.length)) * 42 + 25));

      return {
        ...movie,
        matchScore: score
      };
    })
    .filter(Boolean);

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this',
  'to', 'was', 'what', 'when', 'where', 'who', 'will', 'with', 'the'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}
