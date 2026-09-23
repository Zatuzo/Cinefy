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
          <div className="card-badge">
            {badge}
          </div>
        )}
      </div>

      <div className="card-text-container">
        <div className="card-title">
          {filmName}
        </div>

        <div className="card-meta">
          <span className="card-meta-text">
            {filmYear}{directorName ? ` • ${directorName}` : ''}
          </span>

          {ratingVal && (
            <div className="star-rating">
              <Star size={11} fill="currentColor" />
              <span>{Number(ratingVal).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
