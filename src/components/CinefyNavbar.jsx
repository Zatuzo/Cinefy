// src/components/CinefyNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Star, Sparkles, ChevronDown, Disc3, Compass, BarChart2, Calendar, Film, Settings } from 'lucide-react';
import { searchTMDbMovies } from '../services/tmdb';
import PosterImage from './PosterImage';

export default function CinefyNavbar({ 
  currentTab, 
  setTab, 
  onOpenQuickLog, 
  onOpenUpload, 
  onSelectMovie,
  totalFilms = 0,
  watchlistCount = 0
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Global Keyboard Shortcuts: ⌘K or / to search, Escape to close
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchTMDbMovies(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setIsSearchOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home', icon: Film },
    { id: 'diary', label: 'Diary', icon: Calendar },
    { id: 'rewind', label: 'Rewind', icon: Sparkles },
    { id: 'mixes', label: 'Mixes', icon: Disc3 },
    { id: 'semantic', label: 'Vibe Search', icon: Compass },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 }
  ];

  return (
    <header className="cf-header">
      <div className="cf-nav-container">
        {/* Left Cluster: Brand Logo + Profile */}
        <div className="cf-nav-left-cluster">
          {/* 1. Custom Cinefy Anamorphic Brand Logo */}
          <div className="cf-brand-group" onClick={() => setTab('home')}>
            <div className="cf-logo-mark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#cf-grad-1)" />
                <path d="M2 17L12 22L22 17" stroke="url(#cf-grad-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="url(#cf-grad-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="cf-grad-1" x1="2" y1="2" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FB3640" />
                    <stop offset="1" stopColor="#ff525b" />
                  </linearGradient>
                  <linearGradient id="cf-grad-2" x1="2" y1="12" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FB3640" />
                    <stop offset="1" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="cf-brand-text-wrap">
              <span className="cf-logo-text">CINEFY</span>
            </div>
          </div>

          <div className="cf-nav-divider-v" />

          {/* 2. User Profile Pill */}
          <div className="cf-profile-item" ref={profileDropdownRef}>
            <button 
              className={`cf-profile-btn ${isProfileOpen ? 'active' : ''}`}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="cf-avatar">
                <span>Z</span>
              </div>
              <span className="cf-username">Zatuzo</span>
              <ChevronDown size={12} className="cf-chevron" />
            </button>

            {isProfileOpen && (
              <div className="cf-profile-menu">
                <div className="cf-profile-header">
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>Zatuzo</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CineMetrics Curator</div>
                </div>
                <div className="cf-menu-divider" />
                <div className="cf-profile-stat">
                  <span>Logged Films</span>
                  <span className="cf-stat-badge">{totalFilms}</span>
                </div>
                <div className="cf-profile-stat">
                  <span>Watchlist Queue</span>
                  <span className="cf-stat-badge">{watchlistCount}</span>
                </div>
                <div className="cf-menu-divider" />
                <button className="cf-menu-btn" onClick={() => { setTab('diary'); setIsProfileOpen(false); }}>
                  <Calendar size={14} style={{ color: 'var(--accent-ruby)' }} />
                  <span>Chronological Diary</span>
                </button>
                <button className="cf-menu-btn" onClick={() => { setTab('rewind'); setIsProfileOpen(false); }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-ruby)' }} />
                  <span>Monthly Rewinds</span>
                </button>
                <button className="cf-menu-btn" onClick={() => { setTab('analytics'); setIsProfileOpen(false); }}>
                  <BarChart2 size={14} style={{ color: '#f59e0b' }} />
                  <span>Viewing Analytics</span>
                </button>
                <div className="cf-menu-divider" />
                <button className="cf-menu-btn" onClick={() => { onOpenUpload(); setIsProfileOpen(false); }}>
                  <Settings size={14} style={{ color: 'var(--accent-ruby)' }} />
                  <span>Settings & Import Data</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Central Pill-Shaped Navigation Group (Spotify-Style Library Toggles) */}
        <nav className="cf-nav-pill-group">
          {navLinks.map(link => {
            const isActive = currentTab === link.id;
            const Icon = link.icon;

            return (
              <button
                key={link.id}
                className={`cf-nav-pill-item ${isActive ? 'active' : ''}`}
                onClick={() => setTab(link.id)}
                aria-label={link.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="cf-nav-active-pill"
                    className="cf-nav-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} className="cf-nav-pill-icon" />

                {/* Floating Hover Tooltip */}
                <span className="cf-pin-tooltip">
                  {link.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Cluster: Search & +LOG FILM */}
        <div className="cf-right-actions">
          {/* Live Search Bar with TMDb Autocomplete */}
          <div className="cf-search-wrapper" ref={searchDropdownRef}>
            <Search size={14} className="cf-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search films... (⌘K)"
              className="cf-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setIsSearchOpen(true)}
            />
            <div className="cf-kbd-hint">⌘K</div>

            {/* Dropdown Results */}
            {isSearchOpen && (
              <div className="cf-search-dropdown">
                {isSearching ? (
                  <div className="cf-search-empty">Searching TMDb catalog...</div>
                ) : searchResults.length === 0 ? (
                  <div className="cf-search-empty">No films found for "{searchQuery}"</div>
                ) : (
                  searchResults.map(movie => (
                    <div
                      key={movie.id}
                      className="cf-search-result-item"
                      onClick={() => {
                        onSelectMovie({
                          name: movie.title,
                          year: movie.year,
                          poster: movie.posterUrl,
                          rating: movie.rating ? movie.rating / 2 : 4.0,
                          overview: movie.overview,
                          director: ''
                        });
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div style={{ width: '36px', height: '52px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                        <PosterImage
                          src={movie.posterUrl}
                          name={movie.title}
                          year={movie.year}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cf-result-title">{movie.title}</div>
                        <div className="cf-result-meta">
                          <span>{movie.year || 'N/A'}</span>
                          {movie.rating > 0 && (
                            <>
                              <span>•</span>
                              <span style={{ color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <Star size={10} fill="currentColor" /> {movie.rating.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* + LOG FILM Signature Crimson Button */}
          <button className="cf-log-btn" onClick={() => onOpenQuickLog(null)}>
            <Plus size={15} strokeWidth={3} />
            <span>LOG FILM</span>
          </button>
        </div>
      </div>
    </header>
  );
}
