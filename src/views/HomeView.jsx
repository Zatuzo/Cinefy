// src/views/HomeView.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import { fetchMovieMetadataByName } from '../services/tmdb';
import { ChevronRight, ChevronLeft, Sparkles, Dices, Plus, Bookmark, Compass, TrendingUp, Star, Film } from 'lucide-react';

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

// 1. Reusable Scrollable Media Rail with Floating Arrow Navigation
function ScrollableRail({ children }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (!railRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const currentRail = railRef.current;
    if (currentRail) {
      currentRail.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (currentRail) {
        currentRail.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [children]);

  const handleScroll = (direction) => {
    if (!railRef.current) return;
    const scrollAmount = 600; // Scroll ~3-4 cards
    railRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="rail-wrapper">
      {canScrollLeft && (
        <button
          className="rail-arrow-btn left"
          onClick={() => handleScroll('left')}
          aria-label="Scroll Left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div className="media-rail" ref={railRef}>
        {children}
      </div>

      {canScrollRight && (
        <button
          className="rail-arrow-btn right"
          onClick={() => handleScroll('right')}
          aria-label="Scroll Right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

const MIX_TOP_GRADIENTS = [
  'linear-gradient(90deg, #FB3640, #ff5e66)',
  'linear-gradient(90deg, #06b6d4, #3b82f6)',
  'linear-gradient(90deg, #fbbf24, #f59e0b)',
  'linear-gradient(90deg, #a855f7, #ec4899)'
];

export default function HomeView({ diary = [], watchlist = [], onSelectMovie, onSelectMix, onNavigate }) {
  const [mixes, setMixes] = useState(() => buildCinemaMixes(diary, watchlist, 4));

  // Daily Watchlist Spotlight State
  const initialIndex = useMemo(() => getDailyIndex(watchlist.length), [watchlist.length]);
  const [dailyIndex, setDailyIndex] = useState(initialIndex);

  const dailyFilm = watchlist[dailyIndex] || watchlist[0] || null;
  const [dailyBackdrop, setDailyBackdrop] = useState(dailyFilm?.backdrop || dailyFilm?.backdropUrl || null);

  // Fetch High-Res Backdrop / Movie Still for Spotlight Film
  useEffect(() => {
    if (!dailyFilm) return;
    if (dailyFilm.backdrop || dailyFilm.backdropUrl) {
      setDailyBackdrop(dailyFilm.backdrop || dailyFilm.backdropUrl);
      return;
    }
    const name = dailyFilm.name || dailyFilm.Name || dailyFilm.title;
    const year = dailyFilm.year || dailyFilm.Year;
    if (name) {
      fetchMovieMetadataByName(name, year).then(meta => {
        if (meta?.backdrop) {
          setDailyBackdrop(meta.backdrop);
        }
      });
    }
  }, [dailyFilm]);

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

  // 2. Taste Intelligence Micro-Ribbon Calculations
  const monthlyMetrics = useMemo(() => {
    if (diary.length === 0) return null;

    // Find the active month from the latest diary entry or today
    let latestDate = diary[0]?.date || diary[0]?.Watched_Date || new Date().toISOString();
    const activeMonthYear = latestDate.slice(0, 7); // e.g. "2026-08"
    const [year, month] = activeMonthYear.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const activeMonthName = monthNames[parseInt(month, 10) - 1] || 'This Month';

    const thisMonthFilms = diary.filter(f => {
      const d = f.date || f.Watched_Date || f.Date || '';
      return d.startsWith(activeMonthYear);
    });

    const velocity = thisMonthFilms.length;
    const rated = thisMonthFilms.filter(f => f.rating || f.Rating);
    const avgRating = rated.length > 0
      ? (rated.reduce((acc, f) => acc + Number(f.rating || f.Rating), 0) / rated.length).toFixed(1)
      : null;

    // Top genre this month
    const genreCounts = {};
    thisMonthFilms.forEach(f => {
      const g = f.genre || f.Genre;
      if (g) {
        g.split(',').map(s => s.trim()).filter(s => s && s !== 'Cinema').forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    const topGenre = sortedGenres.slice(0, 2).join(' & ') || 'Drama & Cinema';

    return {
      monthName: activeMonthName,
      velocity,
      avgRating,
      topGenre
    };
  }, [diary]);

  return (
    <div>
      {/* 1. Daily Watchlist Spotlight Hero Section */}
      {dailyFilm ? (() => {
        const rawGenre = dailyFilm.genre || dailyFilm.Genre || '';
        const genreList = rawGenre
          ? rawGenre.split(',').map(g => g.trim()).filter(g => g && g !== 'Cinema')
          : [];
        const runtime = dailyFilm.runtime || dailyFilm.Runtime;

        return (
          <div className="spotlight-card">
            {/* Absolute Blurred Movie Backdrop / Still */}
            {dailyBackdrop && (
              <img
                src={dailyBackdrop}
                alt=""
                aria-hidden="true"
                className="spotlight-backdrop-bg"
              />
            )}

            {/* Dark Gradient Overlay Fading from Left (Dark) to Right (Transparent) */}
            <div className="spotlight-gradient-overlay" />

            {/* Large Movie Poster with Depth & Hover Elevation */}
            <div
              className="spotlight-poster-wrap"
              onClick={() => onSelectMovie(dailyFilm)}
            >
              <PosterImage
                src={dailyFilm.poster || dailyFilm.Poster}
                name={dailyFilm.name || dailyFilm.Name}
                year={dailyFilm.year || dailyFilm.Year}
                className="poster-img"
              />
            </div>

            {/* Film Details & Actions */}
            <div className="spotlight-content">
              {/* Top Block: Tag, Title, Enriched Meta Row, High-Contrast Synopsis */}
              <div>
                <div
                  className="spotlight-tag-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-ruby)',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}
                >
                  <Sparkles size={13} />
                  <span>Recommended from your Watchlist today</span>
                </div>

                <h2
                  style={{
                    fontSize: '24px',
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
                <div
                  className="spotlight-meta-row"
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '10px'
                  }}
                >
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
                    <div className="spotlight-genres-row" style={{ display: 'inline-flex', gap: '5px', flexWrap: 'wrap' }}>
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
                  )}
                </div>

                {/* High Contrast Synopsis */}
                {dailyFilm.overview && (
                  <p
                    className="spotlight-synopsis"
                    style={{
                      fontSize: '13.5px',
                      color: '#cbd5e1',
                      lineHeight: '1.6',
                      maxWidth: '720px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {dailyFilm.overview}
                  </p>
                )}
              </div>

              {/* Bottom Block: Action Buttons */}
              <div className="spotlight-actions">
                <button
                  className="btn-primary"
                  onClick={() => onSelectMovie(dailyFilm)}
                >
                  <Plus size={15} strokeWidth={3} />
                  <span>Log This Film</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={handleShuffleDaily}
                  title="Discover another random film from your watchlist"
                >
                  <Dices size={15} />
                  <span>Pick Another</span>
                </button>
              </div>
            </div>
          </div>
        );
      })() : (
        /* Zero-State for Empty Watchlist */
        <div className="empty-state-card" style={{ marginBottom: '28px' }}>
          <Bookmark size={32} style={{ color: 'var(--accent-cyan)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>Your Watchlist is empty</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: '1.5' }}>
            Queue films from your backlog or use our AI Vibe Search to discover your next favorite cinema screening.
          </p>
          <button className="btn-primary" onClick={() => onNavigate('semantic')} style={{ marginTop: '8px' }}>
            <Compass size={15} />
            <span>Explore Vibe Search</span>
          </button>
        </div>
      )}

      {/* 2. Taste Intelligence Micro-Ribbon */}
      {monthlyMetrics && (
        <div className="taste-ribbon">
          <div className="taste-ribbon-tile">
            <div className="taste-ribbon-icon-wrap" style={{ background: 'var(--accent-ruby-subtle)', color: 'var(--accent-ruby)' }}>
              <TrendingUp size={20} />
            </div>
            <div className="taste-ribbon-info">
              <div className="taste-ribbon-label">Monthly Pace</div>
              <div className="taste-ribbon-val">{monthlyMetrics.velocity} films in {monthlyMetrics.monthName}</div>
            </div>
          </div>

          <div className="taste-ribbon-tile">
            <div className="taste-ribbon-icon-wrap" style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
              <Star size={20} fill="currentColor" />
            </div>
            <div className="taste-ribbon-info">
              <div className="taste-ribbon-label">{monthlyMetrics.monthName} Average</div>
              <div className="taste-ribbon-val">{monthlyMetrics.avgRating ? `★ ${monthlyMetrics.avgRating} Rating` : 'Unrated'}</div>
            </div>
          </div>

          <div className="taste-ribbon-tile">
            <div className="taste-ribbon-icon-wrap" style={{ background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)' }}>
              <Film size={20} />
            </div>
            <div className="taste-ribbon-info">
              <div className="taste-ribbon-label">Top Genre Focus</div>
              <div className="taste-ribbon-val">{monthlyMetrics.topGenre}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Recently Logged Film Rail with Scroll Arrows */}
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

        <ScrollableRail>
          {recentFilms.map(film => (
            <MovieCard
              key={film.id || film.name}
              movie={film}
              onSelect={onSelectMovie}
            />
          ))}
        </ScrollableRail>
      </div>

      {/* 4. Cinema Mixes Rail with Upgraded Gradient Header Cards */}
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
          {mixes.map((mix) => (
            <div
              key={mix.id}
              className="mix-deck-item"
              onClick={() => onSelectMix(mix)}
            >
              {/* Layered Stepped Poster Deck (fans open on hover) */}
              <div className="mix-deck-stage">
                {mix.films.slice(0, 4).map((film, fIdx) => (
                  <div
                    key={film.id || fIdx}
                    className={`deck-poster deck-poster-${fIdx}`}
                  >
                    <PosterImage
                      src={film.poster}
                      name={film.name}
                      year={film.year}
                      className="mix-thumb"
                    />
                  </div>
                ))}
              </div>

              {/* Title & Clean Film Count */}
              <div className="mix-deck-title">{mix.title}</div>
              <div className="mix-deck-vibe">{mix.films.length} unwatched films</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Watchlist Queue with Scroll Arrows */}
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

          <ScrollableRail>
            {watchlistQueue.map(film => (
              <MovieCard
                key={film.id || film.name}
                movie={film}
                onSelect={onSelectMovie}
              />
            ))}
          </ScrollableRail>
        </div>
      )}

      {/* 6. 5-Star Masterpieces with Scroll Arrows */}
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

          <ScrollableRail>
            {topRatedFilms.map(film => (
              <MovieCard
                key={film.id || film.name}
                movie={film}
                onSelect={onSelectMovie}
              />
            ))}
          </ScrollableRail>
        </div>
      )}
    </div>
  );
}
