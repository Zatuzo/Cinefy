// src/views/MixesView.jsx
import React, { useState, useEffect } from 'react';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import MovieCard from '../components/MovieCard';
import { Disc3, Sparkles, Dices, Hash } from 'lucide-react';

const MIX_GRADIENTS = [
  'linear-gradient(90deg, #FB3640, #ff5e66)',
  'linear-gradient(90deg, #06b6d4, #3b82f6)',
  'linear-gradient(90deg, #fbbf24, #f59e0b)',
  'linear-gradient(90deg, #a855f7, #ec4899)',
  'linear-gradient(90deg, #10b981, #059669)',
  'linear-gradient(90deg, #f97316, #ea580c)'
];

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

  const handleShuffleCurrentMix = () => {
    setMixes(prev => prev.map(m => {
      if (m.id === selectedMixId) {
        const shuffled = [...m.films].sort(() => Math.random() - 0.5);
        return { ...m, films: shuffled };
      }
      return m;
    }));
  };

  if (mixes.length === 0) {
    return (
      <div className="empty-state-card" style={{ padding: '56px 20px' }}>
        <Disc3 size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Log more films to unlock Cinema Mixes</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Mixes are automatically curated based on the top genres in your diary.
        </p>
      </div>
    );
  }

  const currentMix = mixes.find(m => m.id === selectedMixId) || mixes[0];

  return (
    <div>
      {/* 1. Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>Cinema Mixes</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Curated discovery playlists.
        </p>
      </div>

      {/* 2. Big Mix Selector Pills Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '14px',
        marginBottom: '32px'
      }}>
        {mixes.map((mix, idx) => {
          const isSelected = currentMix?.id === mix.id;
          return (
            <button
              key={mix.id}
              onClick={() => setSelectedMixId(mix.id)}
              style={{
                background: isSelected ? 'rgba(251, 54, 64, 0.16)' : 'var(--bg-card)',
                border: `1px solid ${isSelected ? 'var(--accent-ruby-border)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '800',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isSelected ? '0 0 16px var(--accent-ruby-glow)' : 'none'
              }}
            >
              <Disc3 size={17} style={{ color: isSelected ? 'var(--accent-ruby)' : 'var(--text-muted)' }} />
              <span>{mix.title}</span>
              <span style={{
                background: isSelected ? 'rgba(251, 54, 64, 0.3)' : '#18202e',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {mix.films.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Active Mix Header & Poster Grid */}
      {currentMix && (
        <div>
          {/* Active Mix Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 54, 64, 0.08) 0%, #101520 60%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
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
                marginBottom: '4px'
              }}>
                <Sparkles size={13} />
                <span>CURATED CINEMA PLAYLIST</span>
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {currentMix.title}
              </h2>

              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: '1.5' }}>
                {currentMix.description || 'Unwatched film discoveries and watchlist gems carefully matched to your genre profile.'}
              </p>

              {/* Vibe Tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {['#essential', '#curated', '#unwatched', `#${currentMix.title.toLowerCase().replace(' mix', '')}`].map(tag => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={handleShuffleCurrentMix}
                title="Shuffle recommendations order"
              >
                <Dices size={15} />
                <span>Shuffle Playlist</span>
              </button>

              <div style={{
                background: 'rgba(251, 54, 64, 0.12)',
                border: '1px solid var(--accent-ruby-border)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: '800'
              }}>
                {currentMix.films.length} Gems
              </div>
            </div>
          </div>

          {/* 4. Full-Bleed Movie Poster Cards Grid */}
          {currentMix.films.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '48px 20px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading recommendations...</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
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
