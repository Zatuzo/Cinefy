// src/views/MixesView.jsx
import React, { useState, useEffect } from 'react';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import MovieCard from '../components/MovieCard';
import { Disc3 } from 'lucide-react';

export default function MixesView({ diary, watchlist, onSelectMovie, activeMix: initialActiveMix = null }) {
  const [mixes, setMixes] = useState(() => buildCinemaMixes(diary, watchlist, 6));
  const [selectedMixId, setSelectedMixId] = useState(initialActiveMix?.id || null);

  useEffect(() => {
    const baseMixes = buildCinemaMixes(diary, watchlist, 6);
    setMixes(baseMixes);
    if (!selectedMixId && baseMixes.length > 0) {
      setSelectedMixId(baseMixes[0].id);
    }

    // Populate unwatched discoveries from TMDb
    populateMixDiscoveries(baseMixes, diary).then(enriched => {
      setMixes(enriched);
    });
  }, [diary, watchlist]);

  if (mixes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 20px', background: '#141a24', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <Disc3 size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Log more films to unlock Cinema Mixes</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Mixes are automatically curated based on the top genres in your diary.
        </p>
      </div>
    );
  }

  const currentMix = mixes.find(m => m.id === selectedMixId) || mixes[0];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>Cinema Mixes</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Unwatched discoveries and watchlist gems curated to your favorite genres.
        </p>
      </div>

      {/* Big Mix Selector Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '14px',
        marginBottom: '32px'
      }}>
        {mixes.map(mix => {
          const isSelected = currentMix?.id === mix.id;
          return (
            <button
              key={mix.id}
              onClick={() => setSelectedMixId(mix.id)}
              style={{
                background: isSelected ? 'rgba(251, 54, 64, 0.16)' : '#141a24',
                border: `1px solid ${isSelected ? 'rgba(251, 54, 64, 0.55)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '12px 26px',
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isSelected ? '0 0 16px rgba(251, 54, 64, 0.28)' : 'none'
              }}
            >
              <Disc3 size={17} style={{ color: isSelected ? 'var(--accent-ruby)' : 'var(--text-muted)' }} />
              <span>{mix.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Mix Poster Grid */}
      {currentMix && (
        <div>
          {/* Active Mix Header */}
          <div className="section-header" style={{ marginBottom: '24px' }}>
            <h2 className="section-title" style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>
              {currentMix.title}
            </h2>
            <div style={{
              background: '#141a24',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              {currentMix.films.length} Recommended Discoveries
            </div>
          </div>

          {/* Full-Bleed Movie Poster Cards Grid (Clean with No Rank Badges) */}
          {currentMix.films.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#141a24', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading recommendations...</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {currentMix.films.map((film, idx) => (
                <MovieCard
                  key={film.id || `${film.name}-${idx}`}
                  movie={film}
                  onSelect={onSelectMovie}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
