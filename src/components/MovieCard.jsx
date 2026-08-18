// src/components/MovieCard.jsx
import React from 'react';
import { Star, Repeat } from 'lucide-react';
import PosterImage from './PosterImage';

export default function MovieCard({ movie, onSelect, badge = null }) {
  if (!movie) return null;

  const isRewatch = movie.isRewatch || movie.rewatch === true || movie.Rewatch === 'Yes' || (movie.watchNumber && movie.watchNumber > 1);

  return (
    <div className="media-card" onClick={() => onSelect(movie)}>
      <div className="poster-wrapper">
        <PosterImage
          src={movie.poster}
          name={movie.name}
          year={movie.year}
          className="poster-img"
        />

        {/* Date badge or Rank badge */}
        {badge && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(10, 13, 20, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(251, 54, 64, 0.45)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '0.02em',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
          }}>
            {badge}
          </div>
        )}

        {/* Rewatch Pill on top-right of poster if rewatched */}
        {isRewatch && (
          <div 
            title={movie.watchNumber ? `Rewatch (#${movie.watchNumber} viewing)` : "Rewatched film"}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(10, 13, 20, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              borderRadius: '4px',
              padding: '3px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: '800',
              color: '#10b981',
              zIndex: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
            }}
          >
            <Repeat size={11} strokeWidth={2.6} />
            <span>{movie.watchNumber && movie.watchNumber > 1 ? `x${movie.watchNumber}` : 'REWATCH'}</span>
          </div>
        )}
      </div>

      <div className="card-title" title={movie.name}>
        {movie.name}
      </div>

      <div className="card-meta">
        <span>{movie.year || 'N/A'}{movie.director && movie.director !== 'Unknown Director' && movie.director !== 'Auteur' ? ` • ${movie.director.split(',')[0]}` : ''}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isRewatch && (
            <span title="Rewatch" style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center' }}>
              <Repeat size={11} strokeWidth={2.4} />
            </span>
          )}
          {movie.rating && (
            <div className="star-rating">
              <Star size={11} fill="currentColor" />
              <span>{Number(movie.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
