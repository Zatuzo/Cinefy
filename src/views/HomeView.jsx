// src/views/HomeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import { ChevronRight, Sparkles, Dices, Plus } from 'lucide-react';

// Deterministic daily index based on date string (YYYY-MM-DD)
function getDailyIndex(length) {
  if (!length || length <= 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

export default function HomeView({ diary, watchlist, onSelectMovie, onSelectMix, onNavigate }) {
  const [mixes, setMixes] = useState(() => buildCinemaMixes(diary, watchlist, 4));

  // Daily Watchlist Spotlight State
  const initialIndex = useMemo(() => getDailyIndex(watchlist.length), [watchlist.length]);
  const [dailyIndex, setDailyIndex] = useState(initialIndex);

  const dailyFilm = watchlist[dailyIndex] || watchlist[0] || null;

  const handleShuffleDaily = () => {
    if (watchlist.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * watchlist.length);
    if (nextIdx === dailyIndex) {
      nextIdx = (nextIdx + 1) % watchlist.length;
    }
    setDailyIndex(nextIdx);
  };

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
      {/* 1. Daily Watchlist Spotlight Hero Section (Polished Readability & Depth) */}
      {dailyFilm && (() => {
        const rawGenre = dailyFilm.genre || dailyFilm.Genre || '';
        const genreList = rawGenre
          ? rawGenre.split(',').map(g => g.trim()).filter(g => g && g !== 'Cinema')
          : [];
        const runtime = dailyFilm.runtime || dailyFilm.Runtime;

        return (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 54, 64, 0.06) 0%, #101520 60%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '44px',
            display: 'flex',
            gap: '28px',
            alignItems: 'stretch',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            {/* Large Movie Poster with Depth & Hover Elevation */}
            <div
              style={{
                width: '140px',
                flexShrink: 0,
                aspectRatio: '2 / 3',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: '#0a0d14',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(251, 54, 64, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)';
              }}
              onClick={() => onSelectMovie(dailyFilm)}
            >
              <PosterImage
                src={dailyFilm.poster || dailyFilm.Poster}
                name={dailyFilm.name || dailyFilm.Name}
                year={dailyFilm.year || dailyFilm.Year}
                className="poster-img"
              />
            </div>

            {/* Film Details & Actions (Snapped top and bottom) */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Top Block: Tag, Title, Enriched Meta Row, High-Contrast Synopsis */}
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-ruby)',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}>
                  <Sparkles size={13} />
                  <span>Recommended from your Watchlist today</span>
                </div>

                <h2
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    marginBottom: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectMovie(dailyFilm)}
                >
                  {dailyFilm.name || dailyFilm.Name}
                </h2>

                {/* Enriched Metadata Row */}
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontWeight: '800', color: '#ffffff' }}>
                    {dailyFilm.year || dailyFilm.Year || 'N/A'}
                  </span>

                  {runtime && (
                    <>
                      <span>•</span>
                      <span>{runtime}m</span>
                    </>
                  )}

                  {dailyFilm.director && dailyFilm.director !== 'Unknown Director' && dailyFilm.director !== 'Auteur' && (
                    <>
                      <span>•</span>
                      <span>Dir. {dailyFilm.director.split(',')[0]}</span>
                    </>
                  )}

                  {genreList.length > 0 && (
                    <>
                      <span>•</span>
                      <div style={{ display: 'inline-flex', gap: '5px', flexWrap: 'wrap' }}>
                        {genreList.map((g, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.09)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#e2e8f0'
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* High Contrast Synopsis with Ergonomic Line Length */}
                {dailyFilm.overview && (
                  <p style={{
                    fontSize: '13.5px',
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    maxWidth: '720px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {dailyFilm.overview}
                  </p>
                )}
              </div>

              {/* Bottom Block: Action Buttons Snapped to Bottom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  onClick={() => onSelectMovie(dailyFilm)}
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Log This Film</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={handleShuffleDaily}
                  title="Pick another random film from your watchlist"
                >
                  <Dices size={15} />
                  <span>Pick Another</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Recently Logged Film Rail */}
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

      {/* 3. Cinema Mixes Rail */}
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

      {/* 4. Watchlist Queue */}
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

      {/* 5. 5-Star Masterpieces */}
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
