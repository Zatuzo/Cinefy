// src/components/QuickLogModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Plus, Check, Star, Calendar, Clock, Film, Sparkles, MessageSquare } from 'lucide-react';
import { searchTMDbMovies } from '../services/tmdb';
import PosterImage from './PosterImage';
import { useOutsideClick } from '../hooks/use-outside-click';

const RATING_VALUES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

export default function QuickLogModal({ initialMovie = null, isOpen, onClose, onSaveFilm }) {
  const [query, setQuery] = useState('');
  const [results, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(initialMovie);
  const [rating, setRating] = useState(4.0);
  const [hoverRating, setHoverRating] = useState(null);
  const [review, setReview] = useState('');
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    if (initialMovie) {
      setSelectedMovie(initialMovie);
      setRating(initialMovie.rating ? parseFloat(initialMovie.rating) : 4.0);
      setReview(initialMovie.review || '');
      setWatchDate(initialMovie.date || initialMovie.Watched_Date || new Date().toISOString().split('T')[0]);
    } else {
      setSelectedMovie(null);
      setQuery('');
      setSearchResults([]);
      setRating(4.0);
      setReview('');
      setWatchDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialMovie, isOpen]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useOutsideClick(modalRef, () => {
    if (isOpen) onClose();
  });

  // Debounced TMDb search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchTMDbMovies(query);
      setSearchResults(res);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMovie) return;

    const d = new Date(watchDate);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const yearVal = selectedMovie.year || selectedMovie.Year;
    const decade = yearVal ? `${Math.floor(parseInt(yearVal, 10) / 10) * 10}s` : '2020s';

    onSaveFilm({
      id: selectedMovie.id || Date.now(),
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
    }, 600);
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;
  const filmTitle = selectedMovie?.title || selectedMovie?.name || selectedMovie?.Name;
  const filmYear = selectedMovie?.year || selectedMovie?.Year;
  const filmPoster = selectedMovie?.posterUrl || selectedMovie?.poster || selectedMovie?.Poster;
  const filmDirector = selectedMovie?.director || selectedMovie?.Director;
  const filmGenre = selectedMovie?.genre || selectedMovie?.Genre;
  const filmRuntime = selectedMovie?.runtime || selectedMovie?.Runtime;
  const filmOverview = selectedMovie?.overview || selectedMovie?.Overview;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 grid place-items-center z-[500] p-4 overflow-y-auto" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}>
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 7, 10, 0.82)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 1
            }}
          />

          {/* 2. Expandable Card Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0e131d',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Floating Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(9, 12, 18, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-hover)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                transition: 'all 0.15s ease'
              }}
              title="Close (Esc)"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-ruby)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(9, 12, 18, 0.85)'; }}
            >
              <X size={16} />
            </motion.button>

            {/* Mode A: Search Film (when no initial movie is selected) */}
            {!selectedMovie ? (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                    Find Film to Log
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Search TMDb to log any screening to your diary
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '40px', height: '44px', fontSize: '14px' }}
                      placeholder="Search title (e.g. Interstellar, Past Lives, Heat)..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* TMDb Search Results */}
                <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isSearching ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px', fontSize: '13px' }}>
                      Searching TMDb catalog...
                    </div>
                  ) : results.length === 0 && query ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px', fontSize: '13px' }}>
                      No films found for "{query}"
                    </div>
                  ) : (
                    results.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMovie(m)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-hover)';
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.background = 'var(--bg-card)';
                        }}
                      >
                        <div style={{ width: '38px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                          <PosterImage
                            src={m.posterUrl}
                            name={m.title}
                            year={m.year}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{m.year || 'N/A'}</span>
                            {m.rating > 0 && (
                              <>
                                <span>•</span>
                                <span style={{ color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: '700' }}>
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
              /* Mode B: Full Expandable Cinema Card & Log Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. Header Media Banner */}
                <div style={{
                  position: 'relative',
                  background: 'linear-gradient(180deg, rgba(251, 54, 64, 0.12) 0%, rgba(14, 19, 29, 0.98) 100%)',
                  padding: '24px 24px 16px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '18px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '72px',
                    aspectRatio: '2 / 3',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: '#0a0d14',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    flexShrink: 0
                  }}>
                    <PosterImage
                      src={filmPoster}
                      name={filmTitle}
                      year={filmYear}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '28px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                      {filmTitle}
                    </h2>

                    <div style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginTop: '4px'
                    }}>
                      <span style={{ fontWeight: '800', color: '#ffffff' }}>{filmYear || 'N/A'}</span>
                      {filmRuntime && <span>• {filmRuntime}m</span>}
                      {filmDirector && filmDirector !== 'Unknown Director' && (
                        <span>• Dir. {filmDirector.split(',')[0]}</span>
                      )}
                    </div>

                    {filmGenre && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {filmGenre.split(',').slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Content Body (Synopsis + Rating + Notes) */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Synopsis snippet */}
                  {filmOverview && (
                    <div style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      maxHeight: '74px',
                      overflowY: 'auto'
                    }}>
                      {filmOverview}
                    </div>
                  )}

                  {/* Star Rating Selector */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Your Rating</label>
                      <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={13} fill="currentColor" />
                        <span>{Number(activeDisplayRating).toFixed(1)} / 5.0</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '4px',
                      background: '#090c12',
                      padding: '5px',
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
                                  ? 'rgba(245, 158, 11, 0.18)'
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
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Watch Date</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ height: '40px', fontSize: '13px' }}
                      value={watchDate}
                      onChange={(e) => setWatchDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Review / Notes */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Review & Notes (Optional)</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                      placeholder="Cinematography, mood, personal highlights..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Footer Action Bar */}
                <div style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: '#090c12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Change Film
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ height: '40px', fontSize: '13px' }}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        height: '40px',
                        fontSize: '13px',
                        background: savedSuccess ? '#10b981' : 'var(--accent-ruby)'
                      }}
                    >
                      {savedSuccess ? <Check size={14} /> : <Plus size={14} strokeWidth={3} />}
                      <span>{savedSuccess ? 'Logged!' : 'Save Log'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
