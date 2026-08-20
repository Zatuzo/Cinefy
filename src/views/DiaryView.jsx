// src/views/DiaryView.jsx
import React, { useState, useMemo } from 'react';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { 
  Calendar, 
  Film, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Clock, 
  Star, 
  Layers, 
  RotateCcw,
  Edit3
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export default function DiaryView({ diary = [], onSelectMovie }) {
  // 1. View Mode Switcher: 'grid' (Default) | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // 2. Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('ALL');
    setSelectedGenre('ALL');
    setSelectedRating('ALL');
    setSortBy('date-desc');
  };

  // 3. Filter and Sort Diary Films
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

  // 4. Group by Month for Continuous Poster Grid Mode
  const monthSections = useMemo(() => {
    if (selectedMonth !== 'ALL') {
      return [{
        monthKey: selectedMonth,
        monthTitle: formatMonthHeader(selectedMonth),
        films: filteredAndSortedFilms
      }];
    }

    const groups = {};
    filteredAndSortedFilms.forEach(film => {
      const d = film.date || film.Watched_Date || film.Date;
      const key = d && typeof d === 'string' && d.length >= 7 ? d.slice(0, 7) : 'Undated';
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });

    return Object.keys(groups)
      .sort()
      .reverse()
      .map(key => ({
        monthKey: key,
        monthTitle: key === 'Undated' ? 'Undated Screenings' : formatMonthHeader(key),
        films: groups[key]
      }));
  }, [filteredAndSortedFilms, selectedMonth]);

  // 5. Quick-Stats Calculations for currently filtered subset
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
            Complete chronological viewing log with multi-view table workstation and custom filters.
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

      {/* 3. Comprehensive Multi-Filter & Sort Toolbar */}
      <div className="diary-toolbar">
        {/* Top Row: Search + Reset + View Mode Toggle */}
        <div className="diary-toolbar-top">
          <div className="diary-search-box">
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search title, director, review..."
              className="form-input"
              style={{ paddingLeft: '40px', height: '44px', fontSize: '13.5px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn-ghost"
                style={{ color: 'var(--accent-ruby)', fontSize: '13px', fontWeight: '800', gap: '6px', height: '44px', padding: '0 14px' }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}

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

        {/* Bottom Row: 4-Column Responsive Filter Grid */}
        <div className="diary-toolbar-bottom">
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
            <option value="5.0">5★ Masterpieces</option>
            <option value="4.0+">4★ and Above</option>
            <option value="3.0+">3★ and Above</option>
          </select>

          {/* Sort Dropdown */}
          <select
            className="diary-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Date (Newest first)</option>
            <option value="date-asc">Date (Oldest first)</option>
            <option value="rating-desc">Rating (Highest first)</option>
            <option value="year-desc">Release Year (Newest)</option>
            <option value="title-asc">Title (A → Z)</option>
          </select>
        </div>
      </div>

      {/* 4. Main Body: Grid View vs. Table View */}
      {filteredAndSortedFilms.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '60px 20px' }}>
          <Film size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>No diary entries match your filters</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '420px' }}>
            Try clearing your search query or adjusting your genre and month filters.
          </p>
          <button className="btn-secondary" onClick={handleResetFilters} style={{ marginTop: '10px' }}>
            <RotateCcw size={14} />
            <span>Clear All Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* =========================================================
           VIEW MODE A: CONTINUOUS POSTER GRID
           ========================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '38px' }}>
          {monthSections.map(section => (
            <div key={section.monthKey} className="diary-month-group">
              {/* Month Section Header */}
              <div className="section-header" style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="section-title" style={{ fontSize: '19px' }}>
                    {section.monthTitle}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                    ({section.films.length} {section.films.length === 1 ? 'film' : 'films'})
                  </span>
                </div>
              </div>

              {/* Full-Width Poster Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
                gap: '20px'
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
              {filteredAndSortedFilms.map((film, idx) => {
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
                        {film.name || film.title}
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

                    {/* Action Button */}
                    <td style={{ textAlign: 'right' }}>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
