// src/views/HomeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import { ChevronRight } from 'lucide-react';

export default function HomeView({ diary, watchlist, onSelectMovie, onSelectMix, onNavigate }) {
  const [mixes, setMixes] = useState(() => buildCinemaMixes(diary, watchlist, 4));

  useEffect(() => {
    const base = buildCinemaMixes(diary, watchlist, 4);
    setMixes(base);
    populateMixDiscoveries(base, diary).then(enriched => {
      setMixes(enriched);
    });
  }, [diary, watchlist]);

  // Recent logs - Preview of top 8 films (sorted descending by date)
  const recentFilms = useMemo(() => {
    return [...diary]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.Watched_Date || a.Date || 0);
        const dateB = new Date(b.date || b.Watched_Date || b.Date || 0);
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [diary]);

  // 5-Star Masterpieces - Preview of top 8 strictly 5.0 rating films
  const topRatedFilms = useMemo(() => {
    return diary.filter(f => Number(f.rating || f.Rating) === 5).slice(0, 8);
  }, [diary]);

  // Watchlist Queue - Preview of top 8 unwatched gems
  const watchlistQueue = useMemo(() => {
    return (watchlist || []).slice(0, 8);
  }, [watchlist]);

  return (
    <div>
      {/* 1. Recently Logged Film Rail */}
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recently Logged</h2>
            <p className="section-subtitle">Latest films added to your viewing diary.</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('diary')}
          >
            <span>Full Diary</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="media-rail">
          {recentFilms.map(film => (
            <MovieCard
              key={film.id}
              movie={film}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      </div>

      {/* 2. Cinema Mixes Rail */}
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Your Cinema Mixes</h2>
            <p className="section-subtitle">Unwatched discoveries tailored to your favorite genres.</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('mixes')}
          >
            <span>All Mixes</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mix-grid">
          {mixes.map(mix => (
            <div
              key={mix.id}
              className="mix-card"
              onClick={() => onSelectMix(mix)}
            >
              <div className="mix-card-top-bar" />
              <div className="mix-card-title">{mix.title}</div>
              <div className="mix-card-desc">{mix.description}</div>

              {/* 4 Poster Thumbnail Strip */}
              <div className="mix-poster-strip">
                {mix.films.slice(0, 4).map((film, idx) => (
                  <div key={film.id || idx} style={{ width: '100%', aspectRatio: '2/3' }}>
                    <PosterImage
                      src={film.poster}
                      name={film.name}
                      year={film.year}
                      className="mix-thumb"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Watchlist Queue */}
      {watchlistQueue.length > 0 && (
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">From Your Watchlist</h2>
              <p className="section-subtitle">Unwatched gems queued for your next screening.</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => onNavigate('semantic')}
            >
              <span>Full Watchlist</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="media-rail">
            {watchlistQueue.map(film => (
              <MovieCard
                key={film.id}
                movie={film}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. 5-Star Masterpieces */}
      {topRatedFilms.length > 0 && (
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">5-Star Masterpieces</h2>
              <p className="section-subtitle">Films awarded a perfect ★ 5.0 rating in your diary.</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => onNavigate('diary')}
            >
              <span>All Masterpieces</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="media-rail">
            {topRatedFilms.map(film => (
              <MovieCard
                key={film.id}
                movie={film}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
