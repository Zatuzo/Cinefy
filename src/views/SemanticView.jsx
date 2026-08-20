// src/views/SemanticView.jsx
import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, X, RotateCcw, Bookmark, Film } from 'lucide-react';
import { searchWatchlistByVibe } from '../services/semanticSearch';
import MovieCard from '../components/MovieCard';

const VIBE_PRESETS = [
  'atmospheric psychological neo noir',
  'mind-bending high concept sci-fi',
  'melancholy romantic drama',
  'gritty crime thriller',
  'poetic introspective slow burn',
  'high-octane thrilling action'
];

export default function SemanticView({ watchlist = [], onSelectMovie }) {
  const [query, setQuery] = useState('atmospheric psychological neo noir');

  const results = useMemo(() => {
    return searchWatchlistByVibe(watchlist, query);
  }, [watchlist, query]);

  return (
    <div>
      {/* 1. Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>Vibe Search</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>
          Search your watchlist by mood, theme, or aesthetic.
        </p>
      </div>

      {/* 2. Hero Vibe Search Input Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Compass size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--accent-ruby)' }} />
          
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: '48px',
              paddingRight: query ? '44px' : '16px',
              height: '52px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
            placeholder="Describe an aesthetic or vibe (e.g. melancholy neo-noir in rain, mind-bending space thriller)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              aria-label="Clear vibe search query"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Curated Vibe Preset Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {VIBE_PRESETS.map(preset => {
          const isActive = query.toLowerCase() === preset.toLowerCase();
          return (
            <button
              key={preset}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'capitalize'
              }}
              onClick={() => setQuery(preset)}
            >
              <Sparkles size={12} style={{ color: isActive ? '#ffffff' : 'var(--accent-ruby)' }} />
              <span>{preset}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Watchlist Vibe Matches Grid */}
      {watchlist.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '56px 20px' }}>
          <Bookmark size={36} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>Your watchlist is empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', maxWidth: '440px' }}>
            Import your Letterboxd <b>watchlist.csv</b> or queue films using the top search bar to unlock semantic vibe search.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '48px 20px' }}>
          <Film size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>No matching films found for "{query}"</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px' }}>
            Try choosing one of the curated vibe presets above or searching for broader terms like "drama" or "action".
          </p>
          <button
            className="btn-secondary"
            onClick={() => setQuery(VIBE_PRESETS[0])}
            style={{ marginTop: '10px' }}
          >
            <RotateCcw size={13} />
            <span>Reset to Neo-Noir Preset</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="section-header" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="section-title" style={{ fontSize: '18px' }}>
                Vibe Matches in Your Watchlist
              </h2>
              <span style={{
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {results.length} Found
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
            gap: '20px'
          }}>
            {results.map(movie => (
              <MovieCard
                key={movie.id || movie.name}
                movie={movie}
                onSelect={onSelectMovie}
                badge={`✨ ${movie.matchScore}% Match`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
