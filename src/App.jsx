// src/App.jsx
import React, { useState, useEffect } from 'react';
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

export default function App() {
  // Initialize from bundled userLibrary or localStorage
  const [diary, setDiary] = useState(() => {
    try {
      const saved = localStorage.getItem('cinefy_diary');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved in localStorage has fewer entries than updated userLibrary, use userLibrary
        if (parsed.length >= (userLibrary.diary || []).length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read diary from localStorage:", e);
    }
    return userLibrary.diary || [];
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
    setDiary(prev => [newFilm, ...prev]);
  };

  const handleDataLoaded = (newDiary, newWatchlist) => {
    if (newDiary && newDiary.length > 0) {
      setDiary(newDiary);
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

      {/* 2. Main Centered Cinema Content */}
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
              onSelectMovie={handleOpenQuickLog}
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
