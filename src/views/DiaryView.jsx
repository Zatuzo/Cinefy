// src/views/DiaryView.jsx
import React, { useState, useMemo } from 'react';
import MovieCard from '../components/MovieCard';
import { Calendar, Film, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';

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

function formatMonthHeader(monthStr) {
  if (!monthStr || monthStr.length < 7) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_FULL[monthIdx] || month} ${year}`;
}

export default function DiaryView({ diary = [], onSelectMovie }) {
  // 1. Extract all available unique months (YYYY-MM) sorted descending
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

  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, rating-desc, title-asc

  // 2. Filter and sort all diary films
  const filteredAndSortedFilms = useMemo(() => {
    let list = [...diary];

    // Filter by month
    if (selectedMonth !== 'ALL') {
      list = list.filter(f => {
        const d = f.date || f.Watched_Date || f.Date;
        return d && typeof d === 'string' && d.startsWith(selectedMonth);
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateA = new Date(a.date || a.Watched_Date || a.Date || 0);
        const dateB = new Date(b.date || b.Watched_Date || b.Date || 0);
        return dateB - dateA;
      }
      if (sortBy === 'rating-desc') {
        return (b.rating || b.Rating || 0) - (a.rating || a.Rating || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      }
      return 0;
    });

    return list;
  }, [diary, selectedMonth, sortBy]);

  // 3. Group by Month Sections for continuous full-bleed grids
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

  const totalScreenings = filteredAndSortedFilms.length;

  return (
    <div className="diary-view-container">
      {/* Header Bar with Month Filter & Sort Selector */}
      <div className="diary-header-bar">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Film Diary</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>
            Continuous visual chronological diary with exact dates on every film.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#141a24',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 12px',
            height: '38px'
          }}>
            <Calendar size={14} style={{ color: 'var(--accent-ruby)', flexShrink: 0 }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 0',
                margin: 0
              }}
            >
              <option value="ALL" style={{ background: '#141a24', color: '#ffffff' }}>
                All Months ({diary.length} films)
              </option>
              {availableMonths.map(m => {
                const count = diary.filter(f => {
                  const d = f.date || f.Watched_Date || f.Date;
                  return d && typeof d === 'string' && d.startsWith(m);
                }).length;
                return (
                  <option key={m} value={m} style={{ background: '#141a24', color: '#ffffff' }}>
                    {formatMonthHeader(m)} ({count} {count === 1 ? 'film' : 'films'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Selector */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#141a24',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 12px',
            height: '38px'
          }}>
            <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 0',
                margin: 0
              }}
            >
              <option value="date-desc" style={{ background: '#141a24', color: '#ffffff' }}>Sort by Watched Date</option>
              <option value="rating-desc" style={{ background: '#141a24', color: '#ffffff' }}>Sort by Rating (Highest)</option>
              <option value="title-asc" style={{ background: '#141a24', color: '#ffffff' }}>Sort by Title (A-Z)</option>
            </select>
          </div>

          {/* Total Count Badge */}
          <div style={{
            background: 'rgba(251, 54, 64, 0.12)',
            border: '1px solid rgba(251, 54, 64, 0.35)',
            color: 'var(--accent-ruby)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {totalScreenings} Films Logged
          </div>
        </div>
      </div>

      {/* Full-Bleed Continuous Poster Grids by Month */}
      {monthSections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 20px', background: '#141a24', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <Film size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>No diary entries found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Choose "All Months" from the dropdown above to view your full library.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '38px' }}>
          {monthSections.map(section => (
            <div key={section.monthKey} className="diary-month-group">
              {/* Section Header */}
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="section-title" style={{ fontSize: '19px' }}>
                    {section.monthTitle}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    ({section.films.length} {section.films.length === 1 ? 'film' : 'films'})
                  </span>
                </div>
              </div>

              {/* Seamless Full-Width Gap-Free Poster Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {section.films.map(film => {
                  const dateLabel = formatCardDate(film.date || film.Watched_Date || film.Date);

                  return (
                    <MovieCard
                      key={film.id || `${film.name}-${film.date}`}
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
      )}
    </div>
  );
}
