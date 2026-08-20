// src/services/mixEngine.js
import { fetchDiscoverByGenre } from './tmdb';

const GENRE_VIBE_LABELS = {
  'Drama': 'essential discoveries',
  'Thriller': 'uncomfortable and disturbing',
  'Crime': 'morally complex & raw',
  'Sci-Fi': 'high concept mindbenders',
  'Horror': 'dread & psychological tension',
  'Mystery': 'atmospheric & slow burns',
  'Romance': 'intimate character studies',
  'Comedy': 'dark wit & sharp dialogue',
  'Animation': 'surreal visual journeys',
  'Adventure': 'expansive worldbuilding',
  'Action': 'relentless momentum',
  'Documentary': 'unflinching true stories'
};

export function buildCinemaMixes(diary = [], watchlist = [], numMixes = 6) {
  if (!diary || diary.length === 0) return [];

  const watchedTitles = new Set(diary.map(f => (f.name || '').toLowerCase().trim()));

  // 1. Tally dominant genres from diary
  const genreCounts = {};
  diary.forEach(film => {
    if (film.genre) {
      const parts = film.genre.split(',').map(g => g.trim()).filter(g => g && g !== 'Cinema');
      parts.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  const sortedGenres = Object.keys(genreCounts)
    .sort((a, b) => genreCounts[b] - genreCounts[a])
    .slice(0, numMixes);

  // 2. Build Mixes containing UNWATCHED films from Watchlist & Discovery
  const mixes = sortedGenres.map(genre => {
    // A. Unwatched matching films from Watchlist
    const fromWatchlist = (watchlist || []).filter(w => {
      const g = (w.genre || '').toLowerCase();
      const isGenreMatch = g.includes(genre.toLowerCase());
      const isNotWatched = !watchedTitles.has((w.name || '').toLowerCase().trim());
      return isGenreMatch && isNotWatched;
    });

    const vibeLabel = GENRE_VIBE_LABELS[genre] || `${genre.toLowerCase()} highlights`;

    return {
      id: `mix_${genre.toLowerCase().replace(/\s+/g, '_')}`,
      title: `${genre} Mix`,
      genre,
      vibeLabel,
      description: `Unwatched ${genre.toLowerCase()} discoveries and watchlist recommendations tailored to your taste profile.`,
      films: fromWatchlist
    };
  });

  return mixes;
}

export async function populateMixDiscoveries(mixes = [], diary = []) {
  const watchedTitles = new Set((diary || []).map(f => (f.name || '').toLowerCase().trim()));

  const populated = await Promise.all(
    mixes.map(async mix => {
      // If mix already has enough watchlist films, keep them; otherwise fetch discoveries
      const existing = [...mix.films];
      const existingTitles = new Set(existing.map(f => f.name.toLowerCase().trim()));

      try {
        const discoveries = await fetchDiscoverByGenre(mix.genre);
        const unwatchedDiscoveries = discoveries.filter(d => {
          const title = (d.name || '').toLowerCase().trim();
          return !watchedTitles.has(title) && !existingTitles.has(title);
        });

        const combined = [...existing, ...unwatchedDiscoveries].slice(0, 16);
        return {
          ...mix,
          films: combined
        };
      } catch {
        return mix;
      }
    })
  );

  return populated;
}
