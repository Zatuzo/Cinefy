// src/views/DiaryView.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { 
  Calendar, 
  Film, 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Clock, 
  Star, 
  Layers, 
  RotateCcw,
  Edit3,
  Trash2,
  ChevronDown,
  ArrowUp
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const INITIAL_MONTHS_COUNT = 4;

function formatCardDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return null;
  try {
    const parts = dateStr.slice(0, 10).split('-');
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${MONTH_NAMES[monthIdx] || 'LOG'} ${day}`;
  } catch {
    return null;
  }
}

function formatTableDate(dateStr, dayOfWeek) {
  if (!dateStr || typeof dateStr !== 'string') return 'Undated';
  try {
    const d = new Date(dateStr);
    const monthIdx = d.getMonth();
    const day = d.getDate();
    const year = d.getFullYear();
    const dayName = dayOfWeek || d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      formatted: `${MONTH_NAMES[monthIdx]} ${day}, ${year}`,
      dayName
    };
  } catch {
    return { formatted: dateStr, dayName: '' };
  }
}

function formatMonthHeader(monthStr) {
  if (!monthStr || monthStr.length < 7) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_FULL[monthIdx] || month} ${year}`;
}

export default function DiaryView({ diary = [], onSelectMovie, onDeleteMovie }) {
  // 1. View Mode Switcher: 'grid' (Default) | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // 2. Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // 3. Progressive Month Scroll State
  const [visibleMonthsCount, setVisibleMonthsCount] = useState(INITIAL_MONTHS_COUNT);
  const sentinelRef = useRef(null);

  // Extract unique months from diary
  const availableMonths = useMemo(() => {
    const set = new Set();
    diary.forEach(f => {
      const d = f.date || f.Watched_Date || f.Date;
      if (d && typeof d === 'string' && d.length >= 7) {
        set.add(d.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [diary]);

  // Extract unique genres from diary
  const availableGenres = useMemo(() => {
    const set = new Set();
    diary.forEach(f => {
      const g = f.genre || f.Genre;
      if (g) {
        g.split(',').map(s => s.trim()).filter(s => s && s !== 'Cinema').forEach(genre => set.add(genre));
      }
    });
    return Array.from(set).sort();
  }, [diary]);

  // Check if any filter is active
  const hasActiveFilters = searchQuery.trim() !== '' || selectedMonth !== 'ALL' || selectedGenre !== 'ALL' || selectedRating !== 'ALL';
  const activeFilterCount = (selectedMonth !== 'ALL' ? 1 : 0) + (selectedGenre !== 'ALL' ? 1 : 0) + (selectedRating !== 'ALL' ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('ALL');
    setSelectedGenre('ALL');
    setSelectedRating('ALL');
    setSortBy('date-desc');
    setVisibleMonthsCount(INITIAL_MONTHS_COUNT);
  };

  // Reset visible months count when filters or sorting change
  useEffect(() => {
    setVisibleMonthsCount(INITIAL_MONTHS_COUNT);
  }, [searchQuery, selectedMonth, selectedGenre, selectedRating, sortBy]);

  // 4. Filter and Sort Diary Films
  const filteredAndSortedFilms = useMemo(() => {
    let list = [...diary];

    // Search query filter (title, director, review notes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f => {
        const title = (f.name || f.Name || f.title || '').toLowerCase();
        const dir = (f.director || f.Director || '').toLowerCase();
        const rev = (f.review || f.Review || '').toLowerCase();
        return title.includes(q) || dir.includes(q) || rev.includes(q);
      });
    }

    // Month filter
    if (selectedMonth !== 'ALL') {
      list = list.filter(f => {
        const d = f.date || f.Watched_Date || f.Date;
        return d && typeof d === 'string' && d.startsWith(selectedMonth);
      });
    }

    // Genre filter
    if (selectedGenre !== 'ALL') {
      list = list.filter(f => {
        const g = f.genre || f.Genre || '';
        return g.includes(selectedGenre);
      });
    }

    // Rating filter
    if (selectedRating !== 'ALL') {
      if (selectedRating === '5.0') {
        list = list.filter(f => Number(f.rating || f.Rating) === 5.0);
      } else if (selectedRating === '4.0+') {
        list = list.filter(f => Number(f.rating || f.Rating) >= 4.0);
      } else if (selectedRating === '3.0+') {
        list = list.filter(f => Number(f.rating || f.Rating) >= 3.0);
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateA = new Date(a.date || a.Watched_Date || a.Date || 0);
        const dateB = new Date(b.date || b.Watched_Date || b.Date || 0);
        return dateB - dateA;
      }
      if (sortBy === 'date-asc') {
        const dateA = new Date(a.date || a.Watched_Date || a.Date || 0);
        const dateB = new Date(b.date || b.Watched_Date || b.Date || 0);
        return dateA - dateB;
      }
      if (sortBy === 'rating-desc') {
        return (b.rating || b.Rating || 0) - (a.rating || a.Rating || 0);
      }
      if (sortBy === 'year-desc') {
        return (parseInt(b.year || b.Year, 10) || 0) - (parseInt(a.year || a.Year, 10) || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.name || a.Name || a.title || '').localeCompare(b.name || b.Name || b.title || '');
      }
      return 0;
    });

    return list;
  }, [diary, searchQuery, selectedMonth, selectedGenre, selectedRating, sortBy]);

  // 5. Group ALL Filtered Films into Full Month Sections
  const allMonthSections = useMemo(() => {
    if (!sortBy.startsWith('date')) {
      const sortTitle = sortBy === 'rating-desc' ? 'Highest Rated Screenings'
        : sortBy === 'year-desc' ? 'Screenings by Release Year'
        : 'Screenings by Title';
      return [{
        monthKey: 'sorted_all',
        monthTitle: sortTitle,
        films: filteredAndSortedFilms
      }];
    }

    const groups = {};
    const order = [];

    filteredAndSortedFilms.forEach(film => {
      const d = film.date || film.Watched_Date || film.Date;
      const key = d && typeof d === 'string' && d.length >= 7 ? d.slice(0, 7) : 'Undated';
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(film);
    });

    return order.map(key => ({
      monthKey: key,
      monthTitle: key === 'Undated' ? 'Undated Screenings' : formatMonthHeader(key),
      films: groups[key]
    }));
  }, [filteredAndSortedFilms, sortBy]);

  const isDateSort = sortBy.startsWith('date');
  const visibleMonthSections = useMemo(() => {
    if (!isDateSort) return allMonthSections;
    return allMonthSections.slice(0, visibleMonthsCount);
  }, [allMonthSections, visibleMonthsCount, isDateSort]);

  const hasMoreMonths = isDateSort && visibleMonthsCount < allMonthSections.length;

  // 6. Progressive Intersection Observer (Infinite Continuous Scroll)
  useEffect(() => {
    if (!hasMoreMonths) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleMonthsCount(prev => Math.min(prev + 3, allMonthSections.length));
      }
    }, {
      rootMargin: '600px 0px' // Smooth pre-loading before hitting the bottom
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreMonths, allMonthSections.length]);

  // 7. Quick-Stats Calculations for currently filtered subset
  const filteredMetrics = useMemo(() => {
    const count = filteredAndSortedFilms.length;
    const totalMins = filteredAndSortedFilms.reduce((acc, f) => acc + (f.runtime || f.Runtime || 110), 0);
    const totalHours = (totalMins / 60).toFixed(0);
    
    const rated = filteredAndSortedFilms.filter(f => f.rating || f.Rating);
    const avgRating = rated.length > 0
      ? (rated.reduce((acc, f) => acc + Number(f.rating || f.Rating), 0) / rated.length).toFixed(2)
      : 'N/A';

    // Top Genre in current view
    const genreCounts = {};
    filteredAndSortedFilms.forEach(f => {
      const g = f.genre || f.Genre;
      if (g) {
        g.split(',').map(s => s.trim()).filter(s => s && s !== 'Cinema').forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    const sortedG = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    const topG = sortedG[0] || 'Drama';
    const topGPct = count > 0 && genreCounts[topG] ? Math.round((genreCounts[topG] / count) * 100) : 0;

    return {
      count,
      totalHours,
      avgRating,
      topGenre: `${topG} (${topGPct}%)`
    };
  }, [filteredAndSortedFilms]);

  return (
    <div className="diary-view-container">
      {/* 1. Diary Title Header */}
      <div className="diary-header-bar">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>Film Diary</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>
            Chronological viewing log.
          </p>
        </div>
      </div>

      {/* 2. Quick-Stats Bar for Filtered Diary */}
      <div className="diary-stats-ribbon">
        <div className="diary-stat-pill">
          <div className="diary-stat-icon" style={{ background: 'var(--accent-ruby-subtle)', color: 'var(--accent-ruby)' }}>
            <Film size={18} />
          </div>
          <div>
            <div className="diary-stat-label">Total Logged</div>
            <div className="diary-stat-value">{filteredMetrics.count} Films</div>
          </div>
        </div>

        <div className="diary-stat-pill">
          <div className="diary-stat-icon" style={{ background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="diary-stat-label">Screen Time</div>
            <div className="diary-stat-value">{filteredMetrics.totalHours} hrs</div>
          </div>
        </div>

        <div className="diary-stat-pill">
          <div className="diary-stat-icon" style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
            <Star size={18} fill="currentColor" />
          </div>
          <div>
            <div className="diary-stat-label">Average Score</div>
            <div className="diary-stat-value">★ {filteredMetrics.avgRating}</div>
          </div>
        </div>

        <div className="diary-stat-pill">
          <div className="diary-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <Layers size={18} />
          </div>
          <div>
            <div className="diary-stat-label">Leading Genre</div>
            <div className="diary-stat-value">{filteredMetrics.topGenre}</div>
          </div>
        </div>
      </div>

      {/* 3. Compact Collapsible Toolbar */}
      <div className="diary-toolbar">
        {/* Top Primary Bar: Instant Search + Filter Toggle + View Mode Toggle */}
        <div className="diary-toolbar-top">
          <div className="diary-search-box">
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search title, director, review notes..."
              className="form-input"
              style={{ paddingLeft: '40px', height: '44px', fontSize: '13.5px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Filter Toggle Button */}
            <button
              className={`btn-secondary ${isFiltersOpen || activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              style={{
                height: '44px',
                padding: '0 14px',
                fontSize: '13px',
                gap: '6px',
                background: isFiltersOpen || activeFilterCount > 0 ? 'rgba(251, 54, 64, 0.12)' : 'var(--bg-card)',
                borderColor: isFiltersOpen || activeFilterCount > 0 ? 'var(--accent-ruby-border)' : 'var(--border-subtle)',
                color: isFiltersOpen || activeFilterCount > 0 ? '#ffffff' : 'var(--text-secondary)'
              }}
              title="Toggle filter controls"
            >
              <SlidersHorizontal size={15} style={{ color: activeFilterCount > 0 ? 'var(--accent-ruby)' : 'inherit' }} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span style={{
                  background: 'var(--accent-ruby)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '2px'
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn-ghost"
                style={{ color: 'var(--accent-ruby)', fontSize: '13px', fontWeight: '800', gap: '4px', height: '44px', padding: '0 10px' }}
                title="Reset all filters"
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* Grid / Table Toggle */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Switch to Poster Grid View"
              >
                <LayoutGrid size={15} />
                <span>Grid</span>
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Switch to Tabular Letterboxd View"
              >
                <List size={15} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Secondary Filter Dropdowns */}
        {isFiltersOpen && (
          <div className="diary-toolbar-bottom" style={{ animation: 'viewFadeIn 0.18s ease forwards' }}>
            {/* Month Dropdown */}
            <select
              className="diary-filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">All Months ({diary.length})</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthHeader(m)}
                </option>
              ))}
            </select>

            {/* Genre Dropdown */}
            <select
              className="diary-filter-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="ALL">All Genres</option>
              {availableGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Rating Dropdown */}
            <select
              className="diary-filter-select"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              <option value="ALL">All Ratings</option>
              <option value="5.0">★★★★★ (5.0 Only)</option>
              <option value="4.0+">★★★★☆ (4.0 & Above)</option>
              <option value="3.0+">★★★☆☆ (3.0 & Above)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              className="diary-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Viewing Date (Newest First)</option>
              <option value="date-asc">Viewing Date (Oldest First)</option>
              <option value="rating-desc">Rating (Highest First)</option>
              <option value="year-desc">Release Year (Newest First)</option>
              <option value="title-asc">Film Title (A to Z)</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Film Presentation Area (Grid or Table) */}
      {filteredAndSortedFilms.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '48px 20px', marginBottom: '40px' }}>
          <Film size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>No diary entries match your filters</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Try clearing your search query or broadening your genre/rating selections.
          </p>
          <button className="btn-secondary" onClick={handleResetFilters} style={{ marginTop: '10px' }}>
            <RotateCcw size={14} />
            <span>Clear All Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* =========================================================
           VIEW MODE A: CONTINUOUS MONTH-BY-MONTH POSTER GRID
           ========================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {visibleMonthSections.map(section => (
            <div key={section.monthKey} className="diary-month-group">
              {/* Month Section Header */}
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="section-title" style={{ fontSize: '18px' }}>
                    {section.monthTitle}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                    ({section.films.length} {section.films.length === 1 ? 'film' : 'films'})
                  </span>
                </div>
              </div>

              {/* Full-Width Complete Month Poster Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '18px'
              }}>
                {section.films.map((film, fIdx) => {
                  const dateLabel = formatCardDate(film.date || film.Watched_Date || film.Date);

                  return (
                    <MovieCard
                      key={film.id || `${film.name || film.Name || film.title}-${film.date || film.Watched_Date || film.Date}-${fIdx}`}
                      movie={film}
                      onSelect={onSelectMovie}
                      badge={dateLabel}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* =========================================================
           VIEW MODE B: LETTERBOXD-STYLE WORKSTATION TABLE
           ========================================================= */
        <div className="diary-table-container">
          <table className="diary-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Date</th>
                <th style={{ width: '56px' }}>Poster</th>
                <th>Film Title</th>
                <th style={{ width: '180px' }}>Director & Genre</th>
                <th style={{ width: '90px' }}>Rating</th>
                <th>Review / Notes</th>
                <th style={{ width: '70px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleMonthSections.map(section => (
                <React.Fragment key={section.monthKey}>
                  {/* Month Subheader in Table */}
                  {isDateSort && allMonthSections.length > 1 && (
                    <tr className="diary-table-month-header">
                      <td colSpan={7}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                          <Calendar size={14} style={{ color: 'var(--accent-ruby)' }} />
                          <span style={{ fontWeight: '800', fontSize: '13px', color: '#ffffff' }}>
                            {section.monthTitle}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>
                            ({section.films.length} {section.films.length === 1 ? 'film' : 'films'})
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {section.films.map((film, idx) => {
                    const dateInfo = formatTableDate(film.date || film.Watched_Date || film.Date, film.dayOfWeek || film.Day_of_Week);
                    const director = film.director && film.director !== 'Unknown Director' && film.director !== 'Auteur'
                      ? film.director.split(',')[0].trim()
                      : null;
                    const genre = film.genre || film.Genre;
                    const ratingNum = film.rating || film.Rating;

                    return (
                      <tr
                        key={film.id || `${film.name || film.Name || film.title}-${idx}`}
                        className="diary-table-row"
                        onClick={() => onSelectMovie && onSelectMovie(film)}
                      >
                        {/* Date */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          <div style={{ fontWeight: '700', color: '#ffffff' }}>{dateInfo.formatted}</div>
                          {dateInfo.dayName && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                              {dateInfo.dayName}
                            </div>
                          )}
                        </td>

                        {/* Poster Thumbnail */}
                        <td>
                          <div style={{ width: '36px', height: '54px', borderRadius: '4px', overflow: 'hidden', background: '#0a0d14', border: '1px solid var(--border-subtle)' }}>
                            <PosterImage
                              src={film.poster || film.Poster || film.posterUrl}
                              name={film.name || film.Name || film.title}
                              year={film.year || film.Year}
                            />
                          </div>
                        </td>

                        {/* Film Title & Year */}
                        <td>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: '#ffffff' }}>
                            {film.name || film.Name || film.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {film.year || 'N/A'}
                          </div>
                        </td>

                        {/* Director & Genre */}
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {director && <div style={{ fontWeight: '600' }}>Dir. {director}</div>}
                          {genre && <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{genre.split(',').slice(0, 2).join(', ')}</div>}
                        </td>

                        {/* Rating */}
                        <td>
                          {ratingNum ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--accent-gold)', fontWeight: '800', fontSize: '13px' }}>
                              <Star size={12} fill="currentColor" />
                              <span>{Number(ratingNum).toFixed(1)}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>—</span>
                          )}
                        </td>

                        {/* Review Snippet */}
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                          {film.review ? (
                            <span style={{ fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                              "{film.review}"
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              className="btn-ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectMovie) onSelectMovie(film);
                              }}
                              style={{ padding: '6px' }}
                              title="Edit / View Screening Details"
                            >
                              <Edit3 size={14} />
                            </button>
                            {onDeleteMovie && (
                              <button
                                className="btn-ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete "${film.name || film.title || 'this film'}" from your diary?`)) {
                                    onDeleteMovie(film);
                                  }
                                }}
                                style={{ padding: '6px', color: 'var(--text-dim)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff5e66'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
                                title="Delete Log from Diary"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Continuous Scroll Sentinel & Older Months Loader */}
      {hasMoreMonths && (
        <div
          ref={sentinelRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 0 16px 0',
            gap: '12px'
          }}
        >
          <button
            className="btn-secondary"
            onClick={() => setVisibleMonthsCount(prev => Math.min(prev + 3, allMonthSections.length))}
            style={{
              height: '42px',
              padding: '0 20px',
              fontSize: '13px',
              fontWeight: '700',
              gap: '8px'
            }}
          >
            <ChevronDown size={16} />
            <span>Load Older Months ({allMonthSections.length - visibleMonthsCount} remaining)</span>
          </button>
        </div>
      )}

      {/* 6. Dignified End-of-Diary Marker */}
      {!hasMoreMonths && filteredAndSortedFilms.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 20px 24px 20px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: '40px',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>
            <Calendar size={16} style={{ color: 'var(--accent-ruby)' }} />
            <span>Beginning of Viewing Diary</span>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {filteredAndSortedFilms.length} total screenings displayed across {allMonthSections.length} {allMonthSections.length === 1 ? 'month' : 'months'}
          </span>
          <button
            className="btn-ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', gap: '4px' }}
          >
            <ArrowUp size={13} />
            <span>Back to Top</span>
          </button>
        </div>
      )}
    </div>
  );
}
