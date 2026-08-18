// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import CinefyNavbar from './components/CinefyNavbar';
import CinefyHeroBanner from './components/CinefyHeroBanner';
import QuickLogModal from './components/QuickLogModal';
import UploadModal from './components/UploadModal';

import HomeView from './views/HomeView';
import DiaryView from './views/DiaryView';
import RewindView from './views/RewindView';
import MixesView from './views/MixesView';
import SemanticView from './views/SemanticView';
import AnalyticsView from './views/AnalyticsView';

import userLibrary from './data/userLibrary.json';

// Chronological rewatch annotator
function annotateRewatches(diaryList = []) {
  if (!Array.isArray(diaryList)) return [];

  // Sort chronologically ascending to calculate watch index (1st watch, 2nd watch, etc.)
  const sorted = [...diaryList].sort((a, b) => {
    const dA = new Date(a.date || a.Watched_Date || a.Date || 0);
    const dB = new Date(b.date || b.Watched_Date || b.Date || 0);
    return dA - dB;
  });

  const countMap = {};
  const annotatedMap = new Map();

  sorted.forEach(film => {
    const key = (film.name || film.Name || film.title || '').trim().toLowerCase();
    const count = (countMap[key] || 0) + 1;
    countMap[key] = count;
    
    // Fix Sugar if matched to wrong movie previously
    let poster = film.poster || film.Poster;
    let director = film.director || film.Director;
    let overview = film.overview || film.Overview;
    let year = film.year || film.Year;

    if (key === 'sugar') {
      poster = 'https://image.tmdb.org/t/p/w500/l0EQ5dNv2vIMGlJOumqyiYyVtay.jpg';
      director = 'Choi Sin-choon';
      overview = 'A working mother and software engineer battles regulations and medical barriers to build a continuous glucose monitor for her son diagnosed with Type 1 diabetes.';
      year = 2026;
    }

    const isRewatch = count > 1 || film.rewatch === true || film.Rewatch === 'Yes';
    const filmKey = film.id || `${film.name}-${film.date}`;

    annotatedMap.set(filmKey, {
      ...film,
      poster,
      director,
      overview,
      year,
      watchNumber: count,
      isRewatch
    });
  });

  return diaryList.map(film => {
    const filmKey = film.id || `${film.name}-${film.date}`;
    return annotatedMap.get(filmKey) || film;
  });
}

export default function App() {
  // Initialize from localStorage or bundled userLibrary
  const [diary, setDiary] = useState(() => {
    try {
      const saved = localStorage.getItem('cinefy_diary');
      if (saved) {
        const parsed = JSON.parse(saved);
        return annotateRewatches(parsed);
      }
    } catch (e) {
      console.warn("Could not read diary from localStorage:", e);
    }
    return annotateRewatches(userLibrary.diary || []);
  });

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cinefy_watchlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read watchlist from localStorage:", e);
    }
    return userLibrary.watchlist || [];
  });

  const [currentTab, setCurrentTab] = useState('home');
  const [activeMix, setActiveMix] = useState(null);

  // Modals
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogFilm, setQuickLogFilm] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Save to localStorage whenever diary or watchlist updates
  useEffect(() => {
    try {
      localStorage.setItem('cinefy_diary', JSON.stringify(diary));
    } catch (e) {
      console.warn("Failed to persist diary to localStorage:", e);
    }
  }, [diary]);

  useEffect(() => {
    try {
      localStorage.setItem('cinefy_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.warn("Failed to persist watchlist to localStorage:", e);
    }
  }, [watchlist]);

  const handleSaveFilm = (newFilm) => {
    setDiary(prev => annotateRewatches([newFilm, ...prev]));
  };

  const handleDataLoaded = (newDiary, newWatchlist) => {
    if (newDiary && newDiary.length > 0) {
      setDiary(annotateRewatches(newDiary));
    }
    if (newWatchlist && newWatchlist.length > 0) {
      setWatchlist(newWatchlist);
    }
  };

  const handleOpenQuickLog = (film = null) => {
    setQuickLogFilm(film);
    setIsQuickLogOpen(true);
  };

  const handleSelectMix = (mix) => {
    setActiveMix(mix);
    setCurrentTab('mixes');
  };

  return (
    <div className="cf-app-shell">
      {/* 1. Cinefy Top Navigation Bar */}
      <CinefyNavbar
        currentTab={currentTab}
        setTab={setCurrentTab}
        onOpenQuickLog={() => handleOpenQuickLog(null)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectMovie={(m) => handleOpenQuickLog(m)}
        totalFilms={diary.length}
        watchlistCount={watchlist.length}
      />

      {/* 2. Cinefy Taste Intelligence Ribbon Banner */}
      <CinefyHeroBanner
        diary={diary}
        watchlist={watchlist}
      />

      {/* 3. Main Centered Cinema Content */}
      <main className="cf-main-wrapper">
        <div className="cf-container">
          {currentTab === 'home' && (
            <HomeView
              diary={diary}
              watchlist={watchlist}
              onSelectMovie={handleOpenQuickLog}
              onSelectMix={handleSelectMix}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'diary' && (
            <DiaryView
              diary={diary}
              onSelectMovie={handleOpenQuickLog}
            />
          )}

          {currentTab === 'rewind' && (
            <RewindView
              diary={diary}
              onSelectMovie={handleOpenQuickLog}
            />
          )}

          {currentTab === 'mixes' && (
            <MixesView
              diary={diary}
              watchlist={watchlist}
              onSelectMovie={handleOpenQuickLog}
              activeMix={activeMix}
            />
          )}

          {currentTab === 'semantic' && (
            <SemanticView
              watchlist={watchlist}
              onSelectMovie={handleOpenQuickLog}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              diary={diary}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        initialMovie={quickLogFilm}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveFilm={handleSaveFilm}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
      />
    </div>
  );
}
