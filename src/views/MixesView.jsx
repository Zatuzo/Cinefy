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
      <div style={{ marginBottom: '36px' }}>
        <div className="mix-grid">
          {mixes.map((mix, idx) => {
            const isSelected = currentMix?.id === mix.id;

            return (
              <div
                key={mix.id}
                className="mix-card"
                onClick={() => setSelectedMixId(mix.id)}
                style={{
                  position: 'relative',
                  borderColor: isSelected ? 'var(--accent-ruby-border)' : 'var(--border-subtle)',
                  background: isSelected ? 'linear-gradient(135deg, rgba(251, 54, 64, 0.08) 0%, #131926 100%)' : 'var(--bg-card)',
                  boxShadow: isSelected ? '0 0 20px var(--accent-ruby-glow)' : 'none'
                }}
              >
                {/* Dynamic Gradient Top Accent Bar */}
                <div
                  className="mix-card-top-bar"
                  style={{
                    background: MIX_GRADIENTS[idx % MIX_GRADIENTS.length],
                    width: '36px',
                    height: '3.5px'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <div className="mix-card-title" style={{ margin: 0, fontSize: '15px' }}>{mix.title}</div>
                  <span style={{
                    background: isSelected ? 'var(--accent-ruby)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isSelected ? 'var(--accent-ruby)' : 'var(--border-subtle)'}`,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}>
                    {mix.films.length}
                  </span>
                </div>

                <div className="mix-card-desc">{mix.description}</div>

                {/* Fanned Poster Deck on Hover */}
                <div className="mix-deck-container">
                  {mix.films.slice(0, 4).map((film, fIdx) => (
                    <div
                      key={film.id || fIdx}
                      className={`deck-card deck-card-${fIdx}`}
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
