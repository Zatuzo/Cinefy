// src/views/AnalyticsView.jsx
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart2, 
  Calendar, 
  Film, 
  Star, 
  TrendingUp, 
  Award, 
  Sparkles, 
  X, 
  Clock, 
  Layers, 
  CheckCircle2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { DAY_ORDER } from '../config';

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatMonthLabel(monthStr) {
  if (!monthStr || monthStr.length < 7) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_FULL_NAMES[monthIdx] || month} ${year}`;
}

export default function AnalyticsView({ diary = [], onSelectMovie }) {
  // 1. Time Range Filter: 'ALL' | '12M' | 'YTD' | '90D'
  const [timeRange, setTimeRange] = useState('ALL');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // 2. Universal Click-to-Drill-Down "Inspected Collection" Modal State
  const [drillDown, setDrillDown] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    films: []
  });

  // Calculate filtered diary based on selected time-range
  const filteredDiary = useMemo(() => {
    if (!diary || diary.length === 0) return [];
    if (timeRange === 'ALL') return diary;

    // Find the latest date in the diary to anchor relative date filters
    let latestTimestamp = 0;
    diary.forEach(f => {
      const d = f.date || f.Watched_Date || f.Date;
      if (d) {
        const ts = new Date(d).getTime();
        if (ts > latestTimestamp) latestTimestamp = ts;
      }
    });

    if (latestTimestamp === 0) latestTimestamp = Date.now();
    const anchorDate = new Date(latestTimestamp);
    const anchorYear = anchorDate.getFullYear().toString();

    return diary.filter(f => {
      const d = f.date || f.Watched_Date || f.Date;
      if (!d) return false;
      const filmDate = new Date(d);
      const filmTimestamp = filmDate.getTime();

      if (timeRange === '12M') {
        const oneYearAgo = latestTimestamp - (365 * 24 * 60 * 60 * 1000);
        return filmTimestamp >= oneYearAgo;
      }
      if (timeRange === 'YTD') {
        return d.startsWith(anchorYear);
      }
      if (timeRange === '90D') {
        const ninetyDaysAgo = latestTimestamp - (90 * 24 * 60 * 60 * 1000);
        return filmTimestamp >= ninetyDaysAgo;
      }
      return true;
    });
  }, [diary, timeRange]);

  // Helper to trigger drill-down modal
  const openDrillDown = (title, categoryLabel, matchingFilms) => {
    if (!matchingFilms || matchingFilms.length === 0) return;

    // Sort matching films by date descending
    const sorted = [...matchingFilms].sort((a, b) => {
      const dA = new Date(a.date || a.Watched_Date || a.Date || 0);
      const dB = new Date(b.date || b.Watched_Date || b.Date || 0);
      return dB - dA;
    });

    const totalMins = sorted.reduce((acc, f) => acc + (f.runtime || f.Runtime || 110), 0);
    const totalHours = (totalMins / 60).toFixed(1);
    const ratings = sorted.filter(f => f.rating || f.Rating).map(f => Number(f.rating || f.Rating));
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null;

    const subtitle = `${sorted.length} ${sorted.length === 1 ? 'film' : 'films'} • ${totalHours} hrs total${avgRating ? ` • Mean ★ ${avgRating}` : ''}${categoryLabel ? ` (${categoryLabel})` : ''}`;

    setDrillDown({
      isOpen: true,
      title,
      subtitle,
      films: sorted
    });
  };

  // Close drill-down modal
  const closeDrillDown = () => {
    setDrillDown(prev => ({ ...prev, isOpen: false }));
  };

  // KPI Calculations
  const totalCount = filteredDiary.length;
  const totalMinutes = filteredDiary.reduce((acc, f) => acc + (f.runtime || f.Runtime || 110), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const ratingsList = filteredDiary.filter(f => f.rating || f.Rating).map(f => Number(f.rating || f.Rating));
  const meanRating = ratingsList.length > 0 ? (ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length).toFixed(2) : 'N/A';
  const numericMean = ratingsList.length > 0 ? ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length : 0;
  const perfect5Count = filteredDiary.filter(f => Number(f.rating || f.Rating) === 5).length;

  // 1. Star Rating Distribution (0.5 to 5.0)
  const ratingBuckets = {
    '0.5': [], '1.0': [], '1.5': [], '2.0': [], '2.5': [],
    '3.0': [], '3.5': [], '4.0': [], '4.5': [], '5.0': []
  };
  let totalRatedCount = 0;

  filteredDiary.forEach(f => {
    const r = f.rating || f.Rating;
    if (r) {
      const key = Number(r).toFixed(1);
      if (ratingBuckets[key]) {
        ratingBuckets[key].push(f);
        totalRatedCount += 1;
      }
    }
  });
  const maxRatingCount = Math.max(...Object.values(ratingBuckets).map(b => b.length), 1);

  // 2. Monthly Trend Distribution
  const monthGroups = {};
  filteredDiary.forEach(f => {
    const my = f.monthYear || f.Month_Year || (f.date || '').slice(0, 7);
    if (my && my.length === 7) {
      if (!monthGroups[my]) monthGroups[my] = [];
      monthGroups[my].push(f);
    }
  });
  const sortedMonths = Object.keys(monthGroups).sort().slice(-12);
  const maxMonthCount = Math.max(...sortedMonths.map(m => monthGroups[m].length), 1);

  // 3. Decades Breakdown
  const decadeGroups = {};
  filteredDiary.forEach(f => {
    let dec = f.decade || f.Decade;
    if (!dec && f.year) {
      const y = parseInt(f.year, 10);
      if (!isNaN(y)) dec = `${Math.floor(y / 10) * 10}s`;
    }
    if (dec && dec !== 'N/A' && dec !== 'NaNs') {
      if (!decadeGroups[dec]) decadeGroups[dec] = [];
      decadeGroups[dec].push(f);
    }
  });
  const sortedDecades = Object.keys(decadeGroups).sort();
  const maxDecadeCount = Math.max(...Object.values(decadeGroups).map(g => g.length), 1);
  const topDecade = sortedDecades.length > 0 ? sortedDecades.reduce((a, b) => (decadeGroups[a]?.length || 0) > (decadeGroups[b]?.length || 0) ? a : b) : '2020s';

  // 4. Day of the Week Rhythm
  const dayGroups = {};
  DAY_ORDER.forEach(d => { dayGroups[d] = []; });
  filteredDiary.forEach(f => {
    const day = f.dayOfWeek || f.Day_of_Week;
    if (day && dayGroups[day]) {
      dayGroups[day].push(f);
    }
  });
  const maxDayCount = Math.max(...Object.values(dayGroups).map(g => g.length), 1);

  // 5. Top Directors Leaderboard
  const directorMap = {};
  filteredDiary.forEach(f => {
    const dStr = f.director || f.Director;
    if (dStr && dStr !== 'Unknown Director' && dStr !== 'Auteur' && dStr !== 'Unknown') {
      const dirs = dStr.split(',').map(d => d.trim());
      dirs.forEach(d => {
        if (d && d !== 'Auteur' && d !== 'Unknown Director') {
          if (!directorMap[d]) directorMap[d] = [];
          directorMap[d].push(f);
        }
      });
    }
  });
  const topDirectors = Object.keys(directorMap)
    .map(name => {
      const films = directorMap[name];
      const rated = films.filter(f => f.rating || f.Rating);
      const avg = rated.length > 0 ? rated.reduce((a, b) => a + Number(b.rating || b.Rating), 0) / rated.length : null;
      return {
        name,
        films,
        count: films.length,
        avgRating: avg
      };
    })
    .sort((a, b) => b.count - a.count || (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 8);

  // 6. Top Genres Matrix
  const genreMap = {};
  filteredDiary.forEach(f => {
    const gStr = f.genre || f.Genre;
    if (gStr) {
      const genres = gStr.split(',').map(g => g.trim()).filter(g => g && g !== 'Cinema');
      genres.forEach(g => {
        if (!genreMap[g]) genreMap[g] = [];
        genreMap[g].push(f);
      });
    }
  });
  const topGenres = Object.keys(genreMap)
    .map(name => ({ name, films: genreMap[name], count: genreMap[name].length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const leadingGenre = topGenres[0]?.name || 'Drama';

  // 7. Critic Persona & Taste DNA Calculation
  const criticPersona = useMemo(() => {
    let generosity = 'Balanced Critic';
    let generosityDesc = 'Even-handed ratings distribution across your logged screenings.';

    if (numericMean >= 4.0) {
      generosity = 'Enthusiastic Cinephile';
      generosityDesc = 'Ratings trend exceptionally high with a strong passion for celebrating film craft.';
    } else if (numericMean < 3.3) {
      generosity = 'Tough Evaluator';
      generosityDesc = 'Demanding and rigorous standards before awarding top star ratings.';
    }

    const archetype = `${topDecade} ${leadingGenre} Purist`;

    return {
      generosity,
      generosityDesc,
      archetype
    };
  }, [numericMean, topDecade, leadingGenre]);

  if (diary.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 20px', background: '#141a24', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <BarChart2 size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>No diary data available</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Log entries or upload your Letterboxd export to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Header & Minimalist Time-Range Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '18px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.02em' }}>Taste Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Viewing habits and cinema intelligence.
          </p>
        </div>

        {/* Minimalist Time Filter Pills */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#141a24',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '4px'
        }}>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: '12M', label: 'Past 12 Months' },
            { id: 'YTD', label: 'This Year' },
            { id: '90D', label: 'Last 90 Days' }
          ].map(tab => {
            const isSelected = timeRange === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                style={{
                  background: isSelected ? 'var(--accent-ruby)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                  boxShadow: isSelected ? '0 2px 10px rgba(251, 54, 64, 0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dynamic Critic Persona Banner (Taste DNA) */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(251, 54, 64, 0.08) 0%, #101520 60%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        onClick={() => openDrillDown('Taste DNA Defining Masterpieces', 'Films with ★ 4.5+ ratings shaping your taste profile', filteredDiary.filter(f => Number(f.rating || f.Rating) >= 4.5))}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-ruby-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-ruby)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px'
          }}>
            <Sparkles size={13} />
            <span>CRITIC PERSONA & TASTE DNA</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '4px' }}>
            {criticPersona.archetype} • {criticPersona.generosity}
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: '1.5' }}>
            {criticPersona.generosityDesc} Rooted in {topDecade} cinema with a strong preference for {leadingGenre} storytelling.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(251, 54, 64, 0.12)',
          border: '1px solid var(--accent-ruby-border)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: '800'
        }}>
          <span>Inspect Taste DNA</span>
          <ArrowUpRight size={15} style={{ color: 'var(--accent-ruby)' }} />
        </div>
      </div>

      {/* 3. Interactive KPI Ribbon Stage */}
      <div className="hero-stage" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span className="hero-tag">
            {timeRange === 'ALL' ? 'ALL TIME SUMMARY' : timeRange === '12M' ? 'PAST 12 MONTHS' : timeRange === 'YTD' ? 'YEAR TO DATE' : 'LAST 90 DAYS'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Click any metric to drill down
          </span>
        </div>

        <div className="hero-kpis" style={{ marginTop: '16px' }}>
          {/* Total Screenings KPI */}
          <div
            className="kpi-tile"
            onClick={() => openDrillDown(`All Screenings (${timeRange === 'ALL' ? 'All Time' : timeRange})`, '', filteredDiary)}
            style={{ cursor: 'pointer', transition: 'border-color var(--transition-fast), transform var(--transition-fast)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-ruby)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="kpi-label">Total Screenings</div>
            <div className="kpi-value" style={{ color: 'var(--accent-ruby)' }}>{totalCount}</div>
          </div>

          {/* Watch Time KPI */}
          <div
            className="kpi-tile"
            onClick={() => openDrillDown('Watch Time Breakdown', 'All logged feature films sorted by runtime', [...filteredDiary].sort((a, b) => (parseInt(b.runtime || b.Runtime || 0, 10) - parseInt(a.runtime || a.Runtime || 0, 10))))}
            style={{ cursor: 'pointer', transition: 'border-color var(--transition-fast), transform var(--transition-fast)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="kpi-label">Watch Time</div>
            <div className="kpi-value">{totalHours} hrs</div>
          </div>

          {/* Mean Rating KPI */}
          <div
            className="kpi-tile"
            onClick={() => openDrillDown('Rated Screenings', `All rated films sorted by score`, [...filteredDiary.filter(f => f.rating || f.Rating)].sort((a, b) => Number(b.rating || b.Rating) - Number(a.rating || a.Rating)))}
            style={{ cursor: 'pointer', transition: 'border-color var(--transition-fast), transform var(--transition-fast)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="kpi-label">Mean Rating</div>
            <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>★ {meanRating}</div>
          </div>

          {/* 5-Star Masterpieces KPI */}
          <div
            className="kpi-tile"
            onClick={() => openDrillDown('5-Star Masterpieces', 'Perfect ★ 5.0 Score', filteredDiary.filter(f => Number(f.rating || f.Rating) === 5))}
            style={{ cursor: 'pointer', transition: 'border-color var(--transition-fast), transform var(--transition-fast)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="kpi-label">5★ Masterpieces</div>
            <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>{perfect5Count} films</div>
          </div>
        </div>
      </div>

      {/* 4. Row 1: Rating Distribution Histogram & Monthly Activity Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* GRAPH 1: Star Rating Distribution (Clickable Bars) */}
        <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={18} color="var(--accent-gold)" fill="var(--accent-gold)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Rating Curve</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Click any bar to inspect
            </span>
          </div>

          {/* Bar Chart Area */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '170px', gap: '10px', paddingBottom: '28px', position: 'relative' }}>
            {Object.keys(ratingBuckets).map(rating => {
              const bucket = ratingBuckets[rating];
              const count = bucket.length;
              const heightPct = (count / maxRatingCount) * 100;
              const isHovered = hoveredDataPoint === `rating_${rating}`;

              return (
                <div
                  key={rating}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    position: 'relative',
                    cursor: count > 0 ? 'pointer' : 'default'
                  }}
                  onMouseEnter={() => setHoveredDataPoint(`rating_${rating}`)}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                  onClick={() => count > 0 && openDrillDown(`Films Rated ★ ${rating}`, `${count} films logged`, bucket)}
                >
                  {/* Tooltip on Hover */}
                  {isHovered && count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-32px',
                      background: '#1c2433',
                      border: '1px solid var(--border-hover)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.7)'
                    }}>
                      ★ {rating}: {count} {count === 1 ? 'film' : 'films'} ({Math.round((count / (totalRatedCount || 1)) * 100)}%) • Click to inspect
                    </div>
                  )}

                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(heightPct, count > 0 ? 6 : 2)}%`,
                      background: isHovered && count > 0
                        ? 'var(--accent-ruby)'
                        : count > 0
                          ? 'var(--accent-ruby-subtle)'
                          : 'rgba(255, 255, 255, 0.02)',
                      borderTop: count > 0 ? '2px solid var(--accent-ruby)' : '1px solid transparent',
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.16s ease',
                      boxShadow: isHovered && count > 0 ? '0 0 12px var(--accent-ruby-glow)' : 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-22px',
                    fontSize: '11px',
                    color: count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontWeight: count > 0 ? '700' : '500'
                  }}>
                    {rating}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 2: Monthly Activity Trendline (Clickable Months) */}
        <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Activity Trend</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Click any month node
            </span>
          </div>

          {/* SVG Area / Line Chart with Clickable Targets */}
          <div style={{ position: 'relative', height: '170px' }}>
            {sortedMonths.length > 1 ? (
              <svg viewBox="0 0 400 130" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-ruby)" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="var(--accent-ruby)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="25" x2="400" y2="25" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="65" x2="400" y2="65" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="105" x2="400" y2="105" stroke="var(--border-subtle)" />

                {/* Path calculation */}
                {(() => {
                  const pts = sortedMonths.map((m, i) => {
                    const x = (i / (sortedMonths.length - 1)) * 380 + 10;
                    const films = monthGroups[m] || [];
                    const val = films.length;
                    const y = 105 - ((val / maxMonthCount) * 80);
                    return { x, y, val, m, films };
                  });

                  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = `${linePath} L ${pts[pts.length - 1].x} 105 L ${pts[0].x} 105 Z`;

                  return (
                    <>
                      <path d={areaPath} fill="url(#areaGradient)" />
                      <path d={linePath} fill="none" stroke="var(--accent-ruby)" strokeWidth="3" strokeLinecap="round" />
                      {pts.map((p, i) => {
                        const isHovered = hoveredDataPoint === `month_${p.m}`;

                        return (
                          <g
                            key={i}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredDataPoint(`month_${p.m}`)}
                            onMouseLeave={() => setHoveredDataPoint(null)}
                            onClick={() => openDrillDown(`Screenings in ${formatMonthLabel(p.m)}`, `${p.val} films`, p.films)}
                          >
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? 7 : 4.5}
                              fill={isHovered ? 'var(--accent-ruby)' : '#0a0d14'}
                              stroke="var(--accent-ruby)"
                              strokeWidth={isHovered ? 3 : 2.5}
                              style={{ transition: 'all 0.15s ease' }}
                            />
                            {/* Invisible wider click target */}
                            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
                Log more months to view activity trendline
              </div>
            )}

            {/* Bottom Month Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => sortedMonths[0] && openDrillDown(`Screenings in ${formatMonthLabel(sortedMonths[0])}`, '', monthGroups[sortedMonths[0]])}>
                {sortedMonths[0] ? formatMonthLabel(sortedMonths[0]) : ''}
              </span>
              <span style={{ cursor: 'pointer' }} onClick={() => sortedMonths[Math.floor(sortedMonths.length / 2)] && openDrillDown(`Screenings in ${formatMonthLabel(sortedMonths[Math.floor(sortedMonths.length / 2)])}`, '', monthGroups[sortedMonths[Math.floor(sortedMonths.length / 2)]])}>
                {sortedMonths[Math.floor(sortedMonths.length / 2)] ? formatMonthLabel(sortedMonths[Math.floor(sortedMonths.length / 2)]) : ''}
              </span>
              <span style={{ cursor: 'pointer' }} onClick={() => sortedMonths[sortedMonths.length - 1] && openDrillDown(`Screenings in ${formatMonthLabel(sortedMonths[sortedMonths.length - 1])}`, '', monthGroups[sortedMonths[sortedMonths.length - 1]])}>
                {sortedMonths[sortedMonths.length - 1] ? formatMonthLabel(sortedMonths[sortedMonths.length - 1]) : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Row 2: Decade Distribution & Weekly Viewing Rhythm */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* GRAPH 3: Decade Distribution (Clickable Rows) */}
        <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={18} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Decade Distribution</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Click any decade
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedDecades.map(decade => {
              const films = decadeGroups[decade] || [];
              const count = films.length;
              const pct = (count / maxDecadeCount) * 100;
              const isHovered = hoveredDataPoint === `decade_${decade}`;

              return (
                <div
                  key={decade}
                  onClick={() => openDrillDown(`${decade} Cinema Collection`, `${count} films logged`, films)}
                  onMouseEnter={() => setHoveredDataPoint(`decade_${decade}`)}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: isHovered ? '#1b2434' : 'transparent',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', color: isHovered ? 'var(--accent-ruby)' : 'var(--text-primary)' }}>{decade}</span>
                    <span style={{ fontWeight: '700' }}>{count} {count === 1 ? 'film' : 'films'}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#0e121a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-ruby), var(--accent-coral))',
                        borderRadius: '4px',
                        boxShadow: isHovered ? '0 0 8px var(--accent-ruby-glow)' : 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 4: Day of the Week Rhythm (Clickable Columns) */}
        <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Weekly Viewing Rhythm</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Click any day
            </span>
          </div>

          {/* Vertical Columns for Days of the Week */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '12px', paddingBottom: '24px', position: 'relative' }}>
            {DAY_ORDER.map(day => {
              const films = dayGroups[day] || [];
              const count = films.length;
              const pct = (count / maxDayCount) * 100;
              const isHovered = hoveredDataPoint === `day_${day}`;

              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    position: 'relative',
                    cursor: count > 0 ? 'pointer' : 'default'
                  }}
                  onMouseEnter={() => setHoveredDataPoint(`day_${day}`)}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                  onClick={() => count > 0 && openDrillDown(`${day} Screenings`, `${count} films watched`, films)}
                >
                  {/* Tooltip on Hover */}
                  {isHovered && count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-32px',
                      background: '#1c2433',
                      border: '1px solid var(--border-hover)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.7)'
                    }}>
                      {day}: {count} {count === 1 ? 'film' : 'films'} • Click to inspect
                    </div>
                  )}

                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, count > 0 ? 8 : 3)}%`,
                      background: isHovered && count > 0
                        ? 'var(--accent-gold)'
                        : count > 0
                          ? 'var(--accent-gold-subtle)'
                          : 'rgba(255, 255, 255, 0.02)',
                      borderTop: count > 0 ? '2px solid var(--accent-gold)' : '1px solid transparent',
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.16s ease',
                      boxShadow: isHovered && count > 0 ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-22px',
                    fontSize: '11px',
                    color: isHovered && count > 0 ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: isHovered || count > 0 ? '700' : '500'
                  }}>
                    {day.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Row 3: Top Genres Breakdown (Clickable Genre Badges) */}
      <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Favorite Genres</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Click any genre to view films
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {topGenres.map(g => (
            <button
              key={g.name}
              onClick={() => openDrillDown(`${g.name} Films`, `${g.count} films in your diary`, g.films)}
              className="btn-secondary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>{g.name}</span>
              <span style={{
                background: '#1e2838',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '10px'
              }}>
                {g.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 7. Row 4: Top Directors Leaderboard (Clickable Director Cards) */}
      <div style={{ background: '#141a24', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Top Directors</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Click any director to view their filmography in your diary
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {topDirectors.map((d, idx) => (
            <div
              key={d.name}
              onClick={() => openDrillDown(`Directed by ${d.name}`, `${d.count} films logged`, d.films)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                background: '#0e121a',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.background = '#161e2b';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = '#0e121a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  #{idx + 1} {d.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {d.count} {d.count === 1 ? 'film' : 'films'} logged
                </div>
              </div>

              {d.avgRating && (
                <div style={{
                  background: 'var(--accent-gold-subtle)',
                  color: 'var(--accent-gold)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Star size={11} fill="currentColor" />
                  <span>{d.avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================
          8. UNIVERSAL CLICK-TO-DRILL-DOWN MODAL
          ========================================================= */}
      {drillDown.isOpen && createPortal(
        <div className="modal-backdrop" onClick={closeDrillDown}>
          <div
            className="modal-content"
            style={{ width: '1080px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {drillDown.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '3px' }}>
                  {drillDown.subtitle}
                </p>
              </div>

              <button
                onClick={closeDrillDown}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251, 54, 64, 0.2)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Full-Bleed Gap-Free Poster Grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '18px'
              }}>
                {drillDown.films.map((film, idx) => (
                  <MovieCard
                    key={film.id || `${film.name || film.Name}-${idx}`}
                    movie={film}
                    onSelect={(f) => {
                      closeDrillDown();
                      if (onSelectMovie) onSelectMovie(f);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
