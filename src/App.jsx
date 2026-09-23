// src/App.jsx
import React, { useState, useEffect } from 'react';
import CinefyNavbar from './components/CinefyNavbar';
import QuickLogModal from './components/QuickLogModal';
import UploadModal from './components/UploadModal';

import HomeView from './views/HomeView';
import DiaryView from './views/DiaryView';
import RewindView from './views/RewindView';
import MixesView from './views/MixesView';
import SemanticView from './views/SemanticView';
import AnalyticsView from './views/AnalyticsView';

import userLibrary from './data/userLibrary.json';

// Helper to determine if two movie references match
export function isSameFilm(f1, f2) {
  if (!f1 || !f2) return false;
  // 1. Direct ID match
  if (f1.id !== undefined && f2.id !== undefined && f1.id !== null && f2.id !== null) {
    if (String(f1.id) === String(f2.id)) return true;
  }
  // 2. Normalized Name + Year match
  const n1 = (f1.name || f1.Name || f1.title || '').trim().toLowerCase();
  const n2 = (f2.name || f2.Name || f2.title || '').trim().toLowerCase();
  if (n1 && n2 && n1 === n2) {
    const y1 = parseInt(f1.year || f1.Year, 10);
    const y2 = parseInt(f2.year || f2.Year, 10);
    if (!y1 || !y2 || y1 === y2) return true;
  }
  return false;
}

export default function App() {
  // Initialize from bundled userLibrary or localStorage
  const [diary, setDiary] = useState(() => {
    try {
      const saved = localStorage.getItem('cinefy_diary');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            id: item.id !== undefined && item.id !== null ? item.id : `log_${idx}_${Date.now()}`
          }));
        }
      }
    } catch (e) {
      console.warn("Could not read diary from localStorage:", e);
    }
    return (userLibrary.diary || []).map((item, idx) => ({
      ...item,
      id: item.id !== undefined && item.id !== null ? item.id : `log_${idx}_${Date.now()}`
    }));
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

  // Scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentTab]);

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

  // CRUD: Save or Log Film (Supports both editing a specific screening AND logging new rewatches)
  const handleSaveFilm = (filmData, isEditing = false, entryIdToUpdate = null) => {
    setDiary(prev => {
      if (isEditing && entryIdToUpdate) {
        // ONLY update the specific screening entry being edited
        return prev.map(item => item.id === entryIdToUpdate ? { ...item, ...filmData, id: entryIdToUpdate } : item);
      }

      // Check if this movie was logged before to automatically flag as rewatch
      const hasBeenLoggedBefore = prev.some(item => isSameFilm(item, filmData));

      // Create a brand NEW distinct diary screening event
      const newEntry = {
        ...filmData,
        id: filmData.id && !prev.some(p => p.id === filmData.id) 
          ? filmData.id 
          : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rewatch: filmData.rewatch !== undefined ? filmData.rewatch : hasBeenLoggedBefore
      };

      return [newEntry, ...prev];
    });

    // Also remove from watchlist if it was queued there
    setWatchlist(prev => prev.filter(w => !isSameFilm(w, filmData)));
  };

  // CRUD: Delete a Film Log from Diary (Supports deleting a specific screening by ID)
  const handleDeleteFilm = (filmToDelete, specificEntryId = null) => {
    if (!filmToDelete && !specificEntryId) return;
    setDiary(prev => {
      const targetId = specificEntryId || filmToDelete?.id;
      if (targetId && prev.some(item => item.id === targetId)) {
        return prev.filter(item => item.id !== targetId);
      }
      return prev.filter(item => !isSameFilm(item, filmToDelete));
    });
  };

  // Watchlist Toggle Handler
  const handleToggleWatchlist = (film) => {
    if (!film) return;
    setWatchlist(prev => {
      const exists = prev.some(w => isSameFilm(w, film));
      if (exists) {
        return prev.filter(w => !isSameFilm(w, film));
      } else {
        const newWatchItem = {
          id: film.id || Date.now(),
          name: film.name || film.title || film.Name,
          year: film.year || film.Year,
          director: film.director || film.Director || '',
          genre: film.genre || film.Genre || 'Cinema',
          overview: film.overview || film.Overview || '',
          poster: film.poster || film.Poster || film.posterUrl || null
        };
        return [newWatchItem, ...prev];
      }
    });
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
              onDeleteMovie={handleDeleteFilm}
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
        diary={diary}
        watchlist={watchlist}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveFilm={handleSaveFilm}
        onDeleteFilm={handleDeleteFilm}
        onToggleWatchlist={handleToggleWatchlist}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
      />
    </div>
  );
}
