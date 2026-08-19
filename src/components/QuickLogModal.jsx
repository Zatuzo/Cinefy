// src/components/QuickLogModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Star } from 'lucide-react';
import { searchTMDbMovies } from '../services/tmdb';
import PosterImage from './PosterImage';

const RATING_VALUES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

export default function QuickLogModal({ initialMovie = null, isOpen, onClose, onSaveFilm }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(initialMovie);
  const [rating, setRating] = useState(4.0);
  const [hoverRating, setHoverRating] = useState(null);
  const [review, setReview] = useState('');
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialMovie) {
      setSelectedMovie(initialMovie);
      setRating(initialMovie.rating ? parseFloat(initialMovie.rating) : 4.0);
      setReview(initialMovie.review || '');
    } else {
      setSelectedMovie(null);
      setQuery('');
      setResults([]);
      setRating(4.0);
      setReview('');
      setWatchDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialMovie, isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchTMDbMovies(query);
      setResults(res);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMovie) return;

    const d = new Date(watchDate);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const yearVal = selectedMovie.year || selectedMovie.Year;
    const decade = yearVal ? `${Math.floor(parseInt(yearVal, 10) / 10) * 10}s` : '2020s';

    onSaveFilm({
      id: Date.now(),
      name: selectedMovie.title || selectedMovie.name || selectedMovie.Name,
      year: parseInt(yearVal, 10) || 2024,
      date: watchDate,
      monthYear,
      dayOfWeek,
      rating: parseFloat(rating),
      director: selectedMovie.director || selectedMovie.Director || 'Director',
      genre: selectedMovie.genre || selectedMovie.Genre || 'Cinema',
      overview: selectedMovie.overview || selectedMovie.Overview || '',
      poster: selectedMovie.posterUrl || selectedMovie.poster || selectedMovie.Poster || null,
      runtime: selectedMovie.runtime || selectedMovie.Runtime || 115,
      decade,
      review
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: '540px', maxWidth: '95vw', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
              {selectedMovie ? 'Log Screening' : 'Find Film to Log'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Add a screening entry to your personal film diary
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: TMDb Search if no movie is selected */}
        {!selectedMovie ? (
          <div>
            <div className="form-group">
              <label className="form-label">Search Film Title</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. Oldboy, Interstellar, Zone of Interest..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isSearching ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '13px' }}>
                  Searching TMDb catalog...
                </div>
              ) : results.length === 0 && query ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '13px' }}>
                  No films found for "{query}"
                </div>
              ) : (
                results.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                    onClick={() => setSelectedMovie(m)}
                  >
                    <div style={{ width: '36px', height: '52px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                      <PosterImage
                        src={m.posterUrl}
                        name={m.title}
                        year={m.year}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{m.year || 'N/A'}</span>
                        {m.rating > 0 && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Star size={11} fill="currentColor" /> {m.rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Selected Film Header */}
            <div style={{
              display: 'flex',
              gap: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              <div style={{ width: '48px', height: '70px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                <PosterImage
                  src={selectedMovie.posterUrl || selectedMovie.poster || selectedMovie.Poster}
                  name={selectedMovie.title || selectedMovie.name || selectedMovie.Name}
                  year={selectedMovie.year || selectedMovie.Year}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedMovie.title || selectedMovie.name || selectedMovie.Name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedMovie.year || selectedMovie.Year || 'N/A'}
                  {selectedMovie.director ? ` • Dir. ${selectedMovie.director.split(',')[0]}` : ''}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMovie(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-ruby)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '4px',
                    padding: 0
                  }}
                >
                  Change Film
                </button>
              </div>
            </div>

            {/* Interactive Star Rating Selector */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Star Rating</label>
                <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} fill="currentColor" />
                  <span>{Number(activeDisplayRating).toFixed(1)} / 5.0</span>
                </div>
              </div>

              {/* Star Rating Quick Click Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '4px',
                background: '#090c12',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                {RATING_VALUES.map(val => {
                  const isSelected = rating === val;
                  const isHighlighted = activeDisplayRating >= val;

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{
                        background: isSelected
                          ? 'var(--accent-ruby)'
                          : isHighlighted
                            ? 'rgba(251, 191, 36, 0.18)'
                            : 'transparent',
                        color: isSelected
                          ? '#ffffff'
                          : isHighlighted
                            ? 'var(--accent-gold)'
                            : 'var(--text-dim)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 0',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Watch Date */}
            <div className="form-group">
              <label className="form-label">Watched Date</label>
              <input
                type="date"
                className="form-input"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                required
              />
            </div>

            {/* Review Notes */}
            <div className="form-group">
              <label className="form-label">Review / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Thoughts on direction, pacing, cinematography, performances..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  background: savedSuccess ? 'var(--accent-emerald)' : 'var(--accent-ruby)'
                }}
              >
                {savedSuccess ? <Check size={15} /> : <Plus size={15} strokeWidth={3} />}
                <span>{savedSuccess ? 'Screening Logged!' : 'Save Log'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
