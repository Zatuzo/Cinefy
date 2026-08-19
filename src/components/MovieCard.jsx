// src/components/MovieCard.jsx
import React from 'react';
import { Star } from 'lucide-react';
import PosterImage from './PosterImage';

export default function MovieCard({ movie, onSelect, badge = null }) {
  if (!movie) return null;

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
      </div>

      <div className="card-title" title={movie.name}>
        {movie.name}
      </div>

      <div className="card-meta">
        <span>{movie.year || 'N/A'}{movie.director && movie.director !== 'Unknown Director' && movie.director !== 'Auteur' ? ` • ${movie.director.split(',')[0]}` : ''}</span>
        {movie.rating && (
          <div className="star-rating">
            <Star size={11} fill="currentColor" />
            <span>{Number(movie.rating).toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
