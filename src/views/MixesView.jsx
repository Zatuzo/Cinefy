// src/views/MixesView.jsx
import React, { useState, useEffect } from 'react';
import { buildCinemaMixes, populateMixDiscoveries } from '../services/mixEngine';
import MovieCard from '../components/MovieCard';
import PosterImage from '../components/PosterImage';
import { Disc3, Sparkles, Dices, Hash, Check } from 'lucide-react';

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

      {/* 2. Cinema Mixes Grid with Fanned Poster Deck Hover Effect */}
      <div style={{ marginBottom: '40px' }}>
        <div className="mix-grid">
          {mixes.map((mix) => {
            const isSelected = currentMix?.id === mix.id;

            return (
              <div
                key={mix.id}
                className="mix-deck-item"
                onClick={() => setSelectedMixId(mix.id)}
                style={{
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {/* Layered Stepped Poster Deck (fans open on hover) */}
                <div
                  className="mix-deck-stage"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 16px var(--accent-ruby-glow))' : 'none'
                  }}
                >
                  {mix.films.slice(0, 4).map((film, fIdx) => (
                    <div
                      key={film.id || fIdx}
                      className={`deck-poster deck-poster-${fIdx}`}
                      style={isSelected && fIdx === 0 ? { borderColor: 'var(--accent-ruby)' } : {}}
                    >
                      <PosterImage
                        src={film.poster}
                        name={film.name}
                        year={film.year}
                        className="mix-thumb"
                      />
                    </div>
                  ))}
                </div>

                {/* Title & Film Count */}
                <div
                  className="mix-deck-title"
                  style={{
                    color: isSelected ? 'var(--accent-ruby)' : 'var(--text-primary)'
                  }}
                >
                  {mix.title}
                </div>
                <div className="mix-deck-vibe">{mix.films.length} unwatched films</div>
              </div>
            );
          })}
        </div>
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
                <span>Selected Cinema Mix</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {currentMix.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '640px', lineHeight: '1.5' }}>
                {currentMix.description}
              </p>

              {/* Vibe Tags */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {currentMix.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Hash size={10} style={{ color: 'var(--accent-ruby)' }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Shuffle Action */}
            <button
              className="btn-secondary"
              onClick={handleShuffleCurrentMix}
              style={{ height: '42px', padding: '0 18px', gap: '8px' }}
            >
              <Dices size={16} />
              <span>Shuffle Playlist</span>
            </button>
          </div>

          {/* Active Mix Movie Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '18px'
          }}>
            {currentMix.films.map((film, fIdx) => (
              <MovieCard
                key={film.id || `${film.name}-${fIdx}`}
                movie={film}
                onSelect={onSelectMovie}
                badge={film.source === 'tmdb_discovery' ? '✨ New Gem' : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
