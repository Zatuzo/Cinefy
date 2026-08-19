// src/components/CinefyNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Star, Sparkles, ChevronDown, Disc3, Compass, BarChart2, Calendar, Film, Settings } from 'lucide-react';
import { searchTMDbMovies } from '../services/tmdb';

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
  
  const searchDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

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
        {/* Left Cluster: Brand Logo + Profile + Pinterest Navigation pinned together on the LEFT */}
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

          <div className="cf-nav-divider-v" />

          {/* 3. Big 24px Icon Navigation with Floating Tooltips */}
          <nav className="cf-pin-icons-wrap">
            {navLinks.map(link => {
              const isActive = currentTab === link.id;
              const Icon = link.icon;

              return (
                <button
                  key={link.id}
                  className={`cf-pin-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setTab(link.id)}
                  aria-label={link.label}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} className="cf-pin-icon" />

                  {/* Floating Hover Tooltip */}
                  <span className="cf-pin-tooltip">
                    {link.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Cluster: Search & +LOG FILM */}
        <div className="cf-right-actions">
          {/* Live Search Bar with TMDb Autocomplete */}
          <div className="cf-search-wrapper" ref={searchDropdownRef}>
            <Search size={14} className="cf-search-icon" />
            <input
              type="text"
              placeholder="Search films..."
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
                      <img
                        src={movie.posterUrl || 'https://via.placeholder.com/92x138/181818/666666?text=No+Poster'}
                        alt={movie.title}
                        className="cf-result-thumb"
                      />
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
