// src/components/MovieCard.jsx
import React from 'react';
import { Star } from 'lucide-react';
import PosterImage from './PosterImage';

export default function MovieCard({ movie, onSelect, badge = null, className = '' }) {
  if (!movie) return null;

  const posterUrl = movie.poster || movie.Poster || movie.posterUrl || null;
  const filmName = movie.name || movie.Name || movie.title || 'Film';
  const filmYear = movie.year || movie.Year || 'N/A';
  const filmDirector = movie.director || movie.Director;
  const directorName = filmDirector && filmDirector !== 'Unknown Director' && filmDirector !== 'Auteur'
    ? filmDirector.split(',')[0].trim()
    : null;
  const ratingVal = movie.rating || movie.Rating;

  return (
    <div
      className={`media-card ${className}`}
      onClick={() => onSelect && onSelect(movie)}
      title={`${filmName} (${filmYear})`}
    >
      <div className="poster-wrapper">
        <PosterImage
          src={posterUrl}
          name={filmName}
          year={filmYear}
          className="poster-img"
        />

        {/* Custom Frosted Badge (e.g. Watch Date or Rank) */}
        {badge && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(9, 12, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '0.02em',
            zIndex: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)'
          }}>
            {badge}
          </div>
        )}
      </div>

      <div className="card-title">
        {filmName}
      </div>

      <div className="card-meta">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: ratingVal ? '130px' : '100%' }}>
          {filmYear}{directorName ? ` • ${directorName}` : ''}
        </span>

        {ratingVal && (
          <div className="star-rating" style={{ flexShrink: 0 }}>
            <Star size={11} fill="currentColor" />
            <span>{Number(ratingVal).toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
