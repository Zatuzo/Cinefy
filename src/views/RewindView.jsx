// src/views/RewindView.jsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Share2, Film, ChevronLeft, ChevronRight, Calendar, Sparkles, Clock, Star, Flame, Award } from 'lucide-react';
import { calculateCinematicPersona } from '../data/personas';
import { generateStoryCardBlob } from '../services/storyCard';
import MovieCard from '../components/MovieCard';

function getMonthYear(film) {
  if (film.monthYear && film.monthYear !== 'Undated') return film.monthYear;
  if (film.Month_Year && film.Month_Year !== 'Undated') return film.Month_Year;
  const d = film.date || film.Watched_Date || film.Date;
  if (d && typeof d === 'string' && d.length >= 7) {
    return d.slice(0, 7);
  }
  return null;
}

function formatMonthLabel(monthStr) {
  if (!monthStr || monthStr.length < 7) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function RewindView({ diary = [], onSelectMovie }) {
  // Extract all unique months and sort descending
  const months = useMemo(() => {
    const set = new Set();
    diary.forEach(f => {
      const my = getMonthYear(f);
      if (my) set.add(my);
    });
    return Array.from(set).sort().reverse();
  }, [diary]);

  const [selectedMonth, setSelectedMonth] = useState(() => months[0] || '2026-08');
  const [isExporting, setIsExporting] = useState(false);

  // Synchronize selectedMonth if months array changes
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] || '2026-08');
  const currentIndex = months.indexOf(activeMonth);

  const handlePrevMonth = () => {
    if (currentIndex < months.length - 1) {
      setSelectedMonth(months[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1]);
    }
  };

  // Filter films for the chosen month
  const monthFilms = useMemo(() => {
    return diary.filter(f => getMonthYear(f) === activeMonth);
  }, [diary, activeMonth]);

  const persona = useMemo(() => calculateCinematicPersona(monthFilms), [monthFilms]);

  // Stats
  const totalFilms = monthFilms.length;
  const totalMins = monthFilms.reduce((acc, f) => acc + (f.runtime || f.Runtime || 110), 0);
  const totalHours = totalMins / 60;
  const ratings = monthFilms.filter(f => f.rating || f.Rating).map(f => Number(f.rating || f.Rating));
  const meanRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // Peak Day
  const dayCounts = {};
  monthFilms.forEach(f => {
    const day = f.dayOfWeek || f.Day_of_Week;
    if (day && day !== 'N/A') {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });
  const peakDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const peakDay = peakDayEntry ? `${peakDayEntry[0]} (${peakDayEntry[1]} films)` : 'Saturday';

  // Top Director
  const dirCounts = {};
  monthFilms.forEach(f => {
    const dir = f.director || f.Director;
    if (dir && dir !== 'Unknown Director' && dir !== 'Auteur' && dir !== 'Unknown') {
      const dirs = dir.split(',').map(d => d.trim());
      dirs.forEach(d => {
        if (d && d !== 'Auteur') dirCounts[d] = (dirCounts[d] || 0) + 1;
      });
    }
  });
  const topDirector = Object.keys(dirCounts).sort((a, b) => dirCounts[b] - dirCounts[a])[0] || 'Various Auteurs';

  // Top Genres
  const genreCounts = {};
  monthFilms.forEach(f => {
    const genre = f.genre || f.Genre;
    if (genre) {
      const gList = genre.split(',').map(g => g.trim()).filter(g => g && g !== 'Cinema');
      gList.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
    }
  });
  const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

  // All month films sorted by rating descending
  const sortedMonthFilms = useMemo(() => {
    return [...monthFilms].sort((a, b) => {
      const rA = a.rating ?? a.Rating ?? 0;
      const rB = b.rating ?? b.Rating ?? 0;
      return rB - rA;
    });
  }, [monthFilms]);

  const leadPoster = sortedMonthFilms[0]?.poster || sortedMonthFilms[0]?.Poster || null;

  const handleShareStory = async () => {
    setIsExporting(true);
    try {
      const blob = await generateStoryCardBlob({
        monthYear: activeMonth,
        persona,
        totalFilms,
        totalHours,
        topDirector,
        topGenres,
        posterUrl: leadPoster
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Try native Web Share if available
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'rewind.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], `cinefy_${activeMonth}.png`, { type: 'image/png' })],
          title: `Cinefy Rewind - ${formatMonthLabel(activeMonth)}`
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cinefy_${activeMonth}_rewind.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {/* 1. Header with Month Stepper Navigator & Share Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.02em' }}>Monthly Rewind</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>
            Viewing recap for <b style={{ color: '#ffffff' }}>{formatMonthLabel(activeMonth)}</b>.
          </p>
        </div>

        {/* Month Stepper Navigator & Share Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn-secondary"
              style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center' }}
              onClick={handlePrevMonth}
              disabled={currentIndex >= months.length - 1}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 14px',
              height: '44px'
            }}>
              <Calendar size={16} style={{ color: 'var(--accent-ruby)', flexShrink: 0 }} />
              <select
                value={activeMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  padding: '4px 0',
                  margin: 0
                }}
              >
                {months.map(m => {
                  const count = diary.filter(f => getMonthYear(f) === m).length;
                  return (
                    <option key={m} value={m} style={{ background: '#141a24', color: '#ffffff' }}>
                      {formatMonthLabel(m)} ({count} {count === 1 ? 'film' : 'films'})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              className="btn-secondary"
              style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center' }}
              onClick={handleNextMonth}
              disabled={currentIndex <= 0}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            className="btn-primary"
            style={{ height: '44px', padding: '0 20px', fontSize: '13.5px' }}
            onClick={handleShareStory}
            disabled={isExporting || monthFilms.length === 0}
          >
            <Share2 size={15} />
            <span>{isExporting ? 'Generating...' : 'Share Story Card'}</span>
          </button>
        </div>
      </div>

      {monthFilms.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '56px 20px' }}>
          <Film size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>No films logged for {formatMonthLabel(activeMonth)}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Choose a different month from the dropdown above to view your rewinds.
          </p>
        </div>
      ) : (
        <>
          {/* 2. Spotify-Wrapped Persona Stage */}
          <div 
            className="hero-stage"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 54, 64, 0.12) 0%, #101520 60%)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="hero-tag">
                  {formatMonthLabel(activeMonth).toUpperCase()} REWIND ARCHETYPE
                </span>
                <h2 className="hero-title" style={{ fontSize: '28px', color: '#ffffff' }}>
                  {persona}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', lineHeight: '1.5' }}>
                  Your cinematic profile for <b>{formatMonthLabel(activeMonth)}</b> based on {totalFilms} screenings. Focused on {topGenres.slice(0, 2).join(' & ') || 'compelling stories'} with direction by {topDirector}.
                </p>
              </div>

              {/* Archetype Badge */}
              <div style={{
                background: 'rgba(251, 54, 64, 0.16)',
                border: '1px solid var(--accent-ruby-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Sparkles size={20} style={{ color: 'var(--accent-ruby)' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-ruby)', textTransform: 'uppercase' }}>TOP VIBE</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>{topGenres[0] || 'Cinema'} Devotee</div>
                </div>
              </div>
            </div>

            {/* 3. KPI Grid (4-Metric Stage) */}
            <div className="hero-kpis" style={{ marginTop: '24px' }}>
              <div className="kpi-tile">
                <div className="kpi-label">Total Screenings</div>
                <div className="kpi-value" style={{ color: 'var(--accent-ruby)' }}>{totalFilms} Films</div>
              </div>

              <div className="kpi-tile">
                <div className="kpi-label">Screen Time</div>
                <div className="kpi-value">{totalHours.toFixed(1)} hrs <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>({(totalHours / 24).toFixed(1)} days)</span></div>
              </div>

              <div className="kpi-tile">
                <div className="kpi-label">Average Score</div>
                <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>{meanRating ? `★ ${meanRating.toFixed(2)}` : 'N/A'}</div>
              </div>

              <div className="kpi-tile">
                <div className="kpi-label">Peak Screening Day</div>
                <div className="kpi-value" style={{ fontSize: '16px', color: '#ffffff' }}>{peakDay}</div>
              </div>
            </div>
          </div>

          {/* 4. Full Month Films Poster Grid */}
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Films Logged in {formatMonthLabel(activeMonth)}</h2>
                <p className="section-subtitle">{sortedMonthFilms.length} screenings ranked by your score.</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
              gap: '20px'
            }}>
              {sortedMonthFilms.map((film, idx) => (
                <MovieCard
                  key={film.id || `${film.name}-${idx}`}
                  movie={film}
                  onSelect={onSelectMovie}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
