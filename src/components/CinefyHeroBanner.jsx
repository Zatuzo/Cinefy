// src/components/CinefyHeroBanner.jsx
import React, { useState, useMemo } from 'react';
import { Sparkles, Dices, Film, Bookmark } from 'lucide-react';
import PosterImage from './PosterImage';

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

export default function CinefyHeroBanner({ diary = [], watchlist = [], onSelectMovie }) {
  // Deterministic daily pick from user's unwatched watchlist
  const initialIndex = useMemo(() => getDailyIndex(watchlist.length), [watchlist.length]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const dailyFilm = watchlist[currentIndex] || watchlist[0] || null;

  // Shuffle for a fresh random pick from the watchlist
  const handleShuffle = (e) => {
    e.stopPropagation();
    if (watchlist.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * watchlist.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % watchlist.length;
    }
    setCurrentIndex(nextIdx);
  };

  return (
    <section className="cf-hero-banner">
      <div className="cf-banner-inner">
        {/* 1. Left: Minimalist Personal Greeting & Cinephile Tagline */}
        <div className="cf-banner-left">
          <h1 className="cf-welcome-headline">
            Hello, <span className="cf-user-name">Zatuzo</span>.
          </h1>
          <p className="cf-welcome-sub">
            Ready for your next screening? Here is your daily watchlist discovery for tonight.
          </p>
        </div>

        {/* 2. Right: Daily Watchlist Discovery Spotlight Card */}
        {dailyFilm && (
          <div
            className="cf-daily-pick-card"
            onClick={() => onSelectMovie && onSelectMovie(dailyFilm)}
            title="Click to view film details & log"
          >
            {/* Poster Thumbnail */}
            <div className="cf-daily-thumb-wrap">
              <PosterImage
                src={dailyFilm.poster || dailyFilm.Poster}
                name={dailyFilm.name || dailyFilm.Name}
                year={dailyFilm.year || dailyFilm.Year}
                className="cf-daily-thumb"
              />
            </div>

            {/* Film Info */}
            <div className="cf-daily-info">
              <div className="cf-daily-tag">
                <Sparkles size={11} style={{ color: 'var(--accent-ruby)' }} />
                <span>TODAY'S WATCHLIST PICK</span>
              </div>
              <div className="cf-daily-title">
                {dailyFilm.name || dailyFilm.Name}
              </div>
              <div className="cf-daily-meta">
                <span>{dailyFilm.year || dailyFilm.Year || 'N/A'}</span>
                {dailyFilm.director && dailyFilm.director !== 'Unknown Director' && dailyFilm.director !== 'Auteur' && (
                  <>
                    <span>•</span>
                    <span className="cf-daily-director">{dailyFilm.director.split(',')[0]}</span>
                  </>
                )}
                {dailyFilm.genre && (
                  <>
                    <span>•</span>
                    <span className="cf-daily-genre">{dailyFilm.genre.split(',')[0]}</span>
                  </>
                )}
              </div>
            </div>

            {/* Shuffle Button */}
            <button
              className="cf-daily-shuffle-btn"
              onClick={handleShuffle}
              title="Shuffle another random film from your watchlist"
              aria-label="Shuffle watchlist film"
            >
              <Dices size={15} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
