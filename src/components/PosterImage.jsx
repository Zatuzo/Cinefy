// src/components/PosterImage.jsx
import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { fetchMovieMetadataByName } from '../services/tmdb';

export default function PosterImage({ src, name, year, className = "poster-img", style = {} }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);

    // If no initial src, attempt fast metadata lookup
    if (!src && name) {
      fetchMovieMetadataByName(name, year).then(meta => {
        if (meta && meta.poster) {
          setImgSrc(meta.poster);
        }
      }).catch(() => {});
    }
  }, [src, name, year]);

  if (!imgSrc || hasError) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #18202e 0%, #0d121a 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '12px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          height: '100%',
          width: '100%',
          userSelect: 'none',
          ...style
        }}
      >
        <Film size={22} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.3'
        }}>
          {name || 'Unknown Film'}
        </span>
        {year && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{year}</span>}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={name || 'Movie Poster'}
      className={className}
      loading="lazy"
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        // Fallback to fetch if the current URL failed
        if (name && !hasError) {
          fetchMovieMetadataByName(name, year).then(meta => {
            if (meta && meta.poster && meta.poster !== imgSrc) {
              setImgSrc(meta.poster);
            } else {
              setHasError(true);
            }
          }).catch(() => setHasError(true));
        } else {
          setHasError(true);
        }
      }}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease, transform var(--transition-fast)',
        ...style
      }}
    />
  );
}
