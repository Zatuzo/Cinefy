// src/components/QuickLogModal.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  Star, 
  Trash2, 
  Edit3, 
  Heart, 
  Bookmark, 
  Eye, 
  Clock, 
  Calendar, 
  Film, 
  Sparkles, 
  MessageSquare, 
  Quote,
  Users,
  RotateCcw,
  History,
  ArrowLeft,
  ChevronRight,
  User,
  Compass,
  Award,
  Tag
} from 'lucide-react';
import { 
  searchTMDbMovies, 
  fetchMovieMetadataByName, 
  fetchMovieDetailsById,
  fetchPersonFilmography,
  fetchMoviesByYear,
  fetchMoviesByGenreName,
  fetchSimilarMovies
} from '../services/tmdb';
import PosterImage from './PosterImage';
import { useOutsideClick } from '../hooks/use-outside-click';

const STAR_SLOTS = [1, 2, 3, 4, 5];

function isSameFilm(f1, f2) {
  if (!f1 || !f2) return false;
  if (f1.id !== undefined && f2.id !== undefined && f1.id !== null && f2.id !== null) {
    if (String(f1.id) === String(f2.id)) return true;
  }
  const n1 = (f1.name || f1.Name || f1.title || '').trim().toLowerCase();
  const n2 = (f2.name || f2.Name || f2.title || '').trim().toLowerCase();
  if (n1 && n2 && n1 === n2) {
    const y1 = parseInt(f1.year || f1.Year, 10);
    const y2 = parseInt(f2.year || f2.Year, 10);
    if (!y1 || !y2 || y1 === y2) return true;
  }
  return false;
}

function formatLogDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function InteractiveStarRating({ rating, hoverRating, setRating, setHoverRating }) {
  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#090c12',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        userSelect: 'none'
      }}
      onMouseLeave={() => setHoverRating(null)}
    >
      {STAR_SLOTS.map((star) => {
        const isFull = activeRating !== null && activeRating >= star;
        const isHalf = activeRating !== null && activeRating === star - 0.5;

        return (
          <div
            key={star}
            style={{
              position: 'relative',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.12s ease'
            }}
          >
            {/* Base Background: Empty Star */}
            <Star
              size={24}
              strokeWidth={1.5}
              color="#334155"
              fill="rgba(255, 255, 255, 0.03)"
            />

            {/* Full Star Overlay */}
            {isFull && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <Star
                  size={24}
                  fill="#fbbf24"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                />
              </div>
            )}

            {/* Half Star Overlay */}
            {isHalf && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  overflow: 'hidden',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Star
                    size={24}
                    fill="#fbbf24"
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            )}

            {/* Left Half Hit Target (0.5 Step) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                zIndex: 10,
                cursor: 'pointer'
              }}
              title={`${star - 0.5} Stars`}
              onMouseEnter={() => setHoverRating(star - 0.5)}
              onClick={() => setRating(star - 0.5)}
            />

            {/* Right Half Hit Target (1.0 Step) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                zIndex: 10,
                cursor: 'pointer'
              }}
              title={`${star}.0 Stars`}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => setRating(star)}
            />
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// Component: Collection & Filmography Explorer View (Within Modal)
// -------------------------------------------------------------
function CinemaExplorerView({ navItem, onSelectFilm, diary = [] }) {
  const [data, setData] = useState({ person: null, movies: [], loading: true });

  useEffect(() => {
    let isMounted = true;
    setData({ person: null, movies: [], loading: true });

    if (navItem.type === 'person') {
      fetchPersonFilmography(navItem.name, navItem.role).then(res => {
        if (isMounted) setData({ person: res.person, movies: res.movies || [], loading: false });
      });
    } else if (navItem.type === 'year') {
      fetchMoviesByYear(navItem.year).then(res => {
        if (isMounted) setData({ person: null, movies: res || [], loading: false });
      });
    } else if (navItem.type === 'genre') {
      fetchMoviesByGenreName(navItem.genre).then(res => {
        if (isMounted) setData({ person: null, movies: res || [], loading: false });
      });
    }

    return () => { isMounted = false; };
  }, [navItem]);

  const { person, movies, loading } = data;

  return (
    <div style={{ padding: '24px 32px 36px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {navItem.type === 'person' && (
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#131924',
            border: '2px solid rgba(251, 54, 64, 0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {person?.profileUrl ? (
              <img src={person.profileUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={36} color="var(--text-dim)" />
            )}
          </div>
        )}

        {navItem.type === 'year' && (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '12px',
            background: 'rgba(251, 54, 64, 0.15)',
            border: '1px solid rgba(251, 54, 64, 0.35)',
            color: 'var(--accent-ruby)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={32} />
          </div>
        )}

        {navItem.type === 'genre' && (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: '#06b6d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Film size={32} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: navItem.type === 'genre' ? '#06b6d4' : 'var(--accent-ruby)',
              background: navItem.type === 'genre' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(251, 54, 64, 0.12)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {navItem.type === 'person' ? (navItem.role || person?.knownForDepartment || 'Filmography') : navItem.type === 'year' ? 'Year in Cinema' : 'Genre Spotlight'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {movies.length > 0 && `${movies.length} Films Available`}
            </span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
            {navItem.type === 'person' ? (person?.name || navItem.name) : navItem.type === 'year' ? `Cinema of ${navItem.year}` : `${navItem.genre} Masterpieces`}
          </h2>

          {person?.biography ? (
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {person.biography}
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {navItem.type === 'year' 
                ? `Explore the most acclaimed and iconic cinematic releases from ${navItem.year}.`
                : navItem.type === 'genre'
                ? `Curated essential works and acclaimed films in the ${navItem.genre} category.`
                : `Filmography and works credited to ${navItem.name}.`}
            </p>
          )}
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Loading collection filmography from TMDb...
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          No films found for this collection.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '16px'
        }}>
          {movies.map((m) => {
            const loggedMatch = (diary || []).find(d => isSameFilm(d, m));
            const isLogged = Boolean(loggedMatch);

            return (
              <div
                key={m.id}
                onClick={() => onSelectFilm(m)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                className="group"
              >
                {/* Poster Container */}
                <div style={{
                  width: '100%',
                  aspectRatio: '2 / 3',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#090d14',
                  border: isLogged ? '1px solid rgba(251, 54, 64, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                  position: 'relative',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}>
                  <PosterImage
                    src={m.posterUrl || m.poster}
                    name={m.title || m.name}
                    year={m.year}
                  />

                  {/* Logged Indicator Badge */}
                  {isLogged && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(9, 12, 18, 0.88)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--accent-ruby)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
                    }}>
                      <Check size={10} color="var(--accent-ruby)" strokeWidth={3} />
                      <span>{loggedMatch.rating ? `★ ${Number(loggedMatch.rating).toFixed(1)}` : 'LOGGED'}</span>
                    </div>
                  )}

                  {/* Community Rating Pill */}
                  {m.rating > 0 && !isLogged && (
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(9, 12, 18, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: 'var(--accent-gold)',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      fontSize: '10px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <Star size={9} fill="currentColor" />
                      <span>{m.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {m.title || m.name}
                  </div>
                  <div style={{
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{m.year || 'N/A'}</span>
                    {m.character && (
                      <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.character}>
                        {m.character}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuickLogModal({
  initialMovie = null,
  isOpen,
  onClose,
  onSaveFilm,
  onDeleteFilm,
  onToggleWatchlist,
  diary = [],
  watchlist = []
}) {
  // Navigation Stack for in-modal rabbit-hole browsing
  const [navStack, setNavStack] = useState(() => [
    { type: 'film', data: initialMovie }
  ]);

  const currentNav = navStack[navStack.length - 1] || { type: 'film', data: initialMovie };
  const selectedMovie = currentNav.type === 'film' ? currentNav.data : null;

  const [query, setQuery] = useState('');
  const [results, setSearchResults] = useState([]);
  const [enrichedData, setEnrichedData] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);

  // Form State
  const [activeLogId, setActiveLogId] = useState(null); // null = Log New Screening; string/number = Edit specific screening
  const [rating, setRating] = useState(4.0);
  const [hoverRating, setHoverRating] = useState(null);
  const [review, setReview] = useState('');
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);

  // Status State
  const [isSearching, setIsSearching] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const modalRef = useRef(null);

  // Find all screenings for this movie in the diary
  const movieLogs = useMemo(() => {
    if (!selectedMovie) return [];
    return (diary || []).filter(d => isSameFilm(d, selectedMovie));
  }, [diary, selectedMovie]);

  // Sort screenings descending by watch date
  const sortedLogs = useMemo(() => {
    return [...movieLogs].sort((a, b) => {
      const da = new Date(a.date || a.Watched_Date || a.Date || 0);
      const db = new Date(b.date || b.Watched_Date || b.Date || 0);
      return db - da;
    });
  }, [movieLogs]);

  const isLogged = movieLogs.length > 0;
  const isEditing = Boolean(activeLogId);
  const inWatchlist = selectedMovie ? (watchlist || []).some(w => isSameFilm(w, selectedMovie)) : false;

  // Initialize or reset modal navigation when opened from outside
  useEffect(() => {
    if (isOpen) {
      setNavStack([{ type: 'film', data: initialMovie }]);
      setConfirmDelete(false);
      setDeleteSuccess(false);
      setSavedSuccess(false);
    }
  }, [isOpen, initialMovie]);

  // Sync Form State when selectedMovie changes
  useEffect(() => {
    if (selectedMovie) {
      const exactMatch = (diary || []).find(d => selectedMovie.id && d.id === selectedMovie.id);
      const matched = exactMatch || (diary || []).find(d => isSameFilm(d, selectedMovie));

      if (exactMatch) {
        setActiveLogId(exactMatch.id);
        setRating(exactMatch.rating !== undefined && exactMatch.rating !== null ? parseFloat(exactMatch.rating) : 4.0);
        setReview(exactMatch.review || '');
        setWatchDate(exactMatch.date || exactMatch.Watched_Date || exactMatch.Date || new Date().toISOString().split('T')[0]);
        setIsFavorite(Boolean(exactMatch.isFavorite || exactMatch.liked));
        setIsRewatch(Boolean(exactMatch.rewatch));
      } else if (matched) {
        setActiveLogId(matched.id);
        setRating(matched.rating !== undefined && matched.rating !== null ? parseFloat(matched.rating) : 4.0);
        setReview(matched.review || '');
        setWatchDate(matched.date || matched.Watched_Date || matched.Date || new Date().toISOString().split('T')[0]);
        setIsFavorite(Boolean(matched.isFavorite || matched.liked));
        setIsRewatch(Boolean(matched.rewatch));
      } else {
        setActiveLogId(null);
        setRating(selectedMovie.rating ? parseFloat(selectedMovie.rating) : 4.0);
        setReview('');
        setWatchDate(new Date().toISOString().split('T')[0]);
        setIsFavorite(false);
        setIsRewatch(false);
      }
    } else {
      setEnrichedData(null);
      setActiveLogId(null);
      setQuery('');
      setSearchResults([]);
      setRating(4.0);
      setReview('');
      setWatchDate(new Date().toISOString().split('T')[0]);
      setIsFavorite(false);
      setIsRewatch(false);
    }
  }, [selectedMovie, diary]);

  // Fetch enriched TMDb metadata (backdrop, tagline, cast, TMDb rating, runtime)
  useEffect(() => {
    if (!selectedMovie) {
      setEnrichedData(null);
      setSimilarMovies([]);
      return;
    }

    const title = selectedMovie.title || selectedMovie.name || selectedMovie.Name;
    const year = selectedMovie.year || selectedMovie.Year;

    let isMounted = true;
    fetchMovieMetadataByName(title, year).then(meta => {
      if (isMounted && meta) {
        setEnrichedData(meta);
        // Fetch recommendations based on tmdbId
        const tmdbId = meta.tmdbId || selectedMovie.tmdbId || selectedMovie.id;
        fetchSimilarMovies(tmdbId, title, year).then(sim => {
          if (isMounted) setSimilarMovies(sim || []);
        });
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [selectedMovie]);

  // Navigation handlers
  const handlePushFilm = (movie) => {
    setNavStack(prev => [...prev, { type: 'film', data: movie }]);
  };

  const handlePushPerson = (name, role = 'Actor') => {
    if (!name || name === 'Director' || name === 'Unknown Director') return;
    setNavStack(prev => [...prev, { type: 'person', name, role }]);
  };

  const handlePushYear = (year) => {
    if (!year || isNaN(year)) return;
    setNavStack(prev => [...prev, { type: 'year', year: parseInt(year, 10) }]);
  };

  const handlePushGenre = (genre) => {
    if (!genre || genre === 'Cinema') return;
    setNavStack(prev => [...prev, { type: 'genre', genre }]);
  };

  const handleBack = () => {
    if (navStack.length > 1) {
      setNavStack(prev => prev.slice(0, -1));
    }
  };

  // When a user selects a movie from search results
  const handleSelectSearchedMovie = (movie) => {
    setNavStack(prev => [...prev, { type: 'film', data: movie }]);
  };

  // Switch to Log New Screening mode
  const handleSwitchToNewScreening = () => {
    setActiveLogId(null);
    setRating(4.0);
    setHoverRating(null);
    setReview('');
    setWatchDate(new Date().toISOString().split('T')[0]);
    setIsRewatch(movieLogs.length > 0);
    setConfirmDelete(false);
  };

  // Switch to Edit a specific screening
  const handleSelectScreeningToEdit = (log) => {
    setActiveLogId(log.id);
    setRating(log.rating !== undefined && log.rating !== null ? parseFloat(log.rating) : 4.0);
    setHoverRating(null);
    setReview(log.review || '');
    setWatchDate(log.date || log.Watched_Date || log.Date || new Date().toISOString().split('T')[0]);
    setIsFavorite(Boolean(log.isFavorite || log.liked));
    setIsRewatch(Boolean(log.rewatch));
    setConfirmDelete(false);
  };

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

  // Handle Save / Update Log
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMovie) return;

    const d = new Date(watchDate);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const yearVal = enrichedData?.year || selectedMovie.year || selectedMovie.Year;
    const decade = yearVal ? `${Math.floor(parseInt(yearVal, 10) / 10) * 10}s` : '2020s';

    onSaveFilm({
      id: isEditing ? activeLogId : undefined,
      name: selectedMovie.title || selectedMovie.name || selectedMovie.Name,
      year: parseInt(yearVal, 10) || 2024,
      date: watchDate,
      monthYear,
      dayOfWeek,
      rating: rating !== null && rating !== undefined ? parseFloat(rating) : null,
      director: enrichedData?.director || selectedMovie.director || selectedMovie.Director || 'Director',
      genre: enrichedData?.genre || selectedMovie.genre || selectedMovie.Genre || 'Cinema',
      overview: enrichedData?.overview || selectedMovie.overview || selectedMovie.Overview || '',
      poster: enrichedData?.poster || selectedMovie.posterUrl || selectedMovie.poster || selectedMovie.Poster || null,
      runtime: enrichedData?.runtime || selectedMovie.runtime || selectedMovie.Runtime || 115,
      tagline: enrichedData?.tagline || selectedMovie.tagline || '',
      isFavorite,
      rewatch: isRewatch || (!isEditing && movieLogs.length > 0),
      decade,
      review
    }, isEditing, activeLogId);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  // Handle Delete Log
  const handleDelete = () => {
    if (!selectedMovie || !onDeleteFilm) return;
    onDeleteFilm(selectedMovie, activeLogId);
    setDeleteSuccess(true);
    setTimeout(() => {
      setDeleteSuccess(false);
      setConfirmDelete(false);
      if (movieLogs.length > 1) {
        const remaining = movieLogs.filter(m => m.id !== activeLogId);
        if (remaining.length > 0) {
          handleSelectScreeningToEdit(remaining[0]);
          return;
        }
      }
      onClose();
    }, 500);
  };

  // Extracted Metadata fields
  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;
  const filmTitle = enrichedData?.title || selectedMovie?.title || selectedMovie?.name || selectedMovie?.Name;
  const filmYear = enrichedData?.year || selectedMovie?.year || selectedMovie?.Year;
  const filmPoster = enrichedData?.poster || selectedMovie?.posterUrl || selectedMovie?.poster || selectedMovie?.Poster;
  const filmBackdrop = enrichedData?.backdrop || selectedMovie?.backdropUrl || selectedMovie?.backdrop;
  const filmDirector = enrichedData?.director || selectedMovie?.director || selectedMovie?.Director;
  const filmGenres = enrichedData?.genres || (selectedMovie?.genre ? selectedMovie.genre.split(',').map(s => s.trim()) : ['Cinema']);
  const filmRuntime = enrichedData?.runtime || selectedMovie?.runtime || selectedMovie?.Runtime;
  const filmOverview = enrichedData?.overview || selectedMovie?.overview || selectedMovie?.Overview;
  const filmTagline = enrichedData?.tagline || selectedMovie?.tagline;
  const filmVoteAverage = enrichedData?.voteAverage || selectedMovie?.rating;
  const filmVoteCount = enrichedData?.voteCount;
  const filmCast = enrichedData?.cast || [];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 grid place-items-center z-[500] p-4 overflow-y-auto" 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 999, 
            padding: '16px' 
          }}
        >
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(5, 7, 10, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 1
            }}
          />

          {/* 2. Letterboxd Film Dossier & Explorer Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '980px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#0d121c',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 32px 80px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top Navigation Bar (Back Button + Close Button) */}
            <div style={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'rgba(13, 18, 28, 0.75)',
              backdropFilter: 'blur(16px)',
              borderBottom: navStack.length > 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
            }}>
              {/* Left Side: Back History Button */}
              {navStack.length > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-ruby)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {/* Right Side: Close Button */}
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Close (Esc)"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-ruby)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode A: Person / Year / Genre Explorer View */}
            {currentNav.type !== 'film' ? (
              <CinemaExplorerView
                navItem={currentNav}
                onSelectFilm={handlePushFilm}
                diary={diary}
              />
            ) : !selectedMovie ? (
              /* Mode B: Search Mode (when no movie selected) */
              <div style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Find Film Dossier
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Search the TMDb catalog to explore cast, metadata, and log screenings
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '46px', height: '48px', fontSize: '15px' }}
                      placeholder="Search title (e.g. When Harry Met Sally, Interstellar, Heat)..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Search Results */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isSearching ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px', fontSize: '14px' }}>
                      Searching TMDb catalog...
                    </div>
                  ) : results.length === 0 && query ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px', fontSize: '14px' }}>
                      No films found for "{query}"
                    </div>
                  ) : (
                    results.map(m => {
                      const logsForMovie = (diary || []).filter(d => isSameFilm(d, m));
                      const hasLogs = logsForMovie.length > 0;

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectSearchedMovie(m)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: hasLogs ? 'rgba(251, 54, 64, 0.08)' : 'var(--bg-card)',
                            border: `1px solid ${hasLogs ? 'rgba(251, 54, 64, 0.35)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = hasLogs ? 'var(--accent-ruby)' : 'var(--border-hover)';
                            e.currentTarget.style.background = hasLogs ? 'rgba(251, 54, 64, 0.14)' : 'var(--bg-card-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = hasLogs ? 'rgba(251, 54, 64, 0.35)' : 'var(--border-subtle)';
                            e.currentTarget.style.background = hasLogs ? 'rgba(251, 54, 64, 0.08)' : 'var(--bg-card)';
                          }}
                        >
                          <div style={{ width: '42px', height: '62px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                            <PosterImage
                              src={m.posterUrl}
                              name={m.title}
                              year={m.year}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontWeight: '800', fontSize: '15px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {m.title}
                              </div>
                              {hasLogs && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  color: '#ff5e66',
                                  background: 'rgba(251, 54, 64, 0.18)',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  textTransform: 'uppercase',
                                  flexShrink: 0
                                }}>
                                  {logsForMovie.length === 1 ? 'Logged 1x' : `Logged ${logsForMovie.length}x`}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{m.year || 'N/A'}</span>
                              {m.rating > 0 && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}>
                                    <Star size={12} fill="currentColor" /> {m.rating.toFixed(1)} TMDb
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Mode C: Full Letterboxd Cinema Dossier Modal */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. Hero Backdrop Header */}
                <div style={{
                  position: 'relative',
                  height: '220px',
                  width: '100%',
                  overflow: 'hidden',
                  marginTop: '-56px',
                  background: 'linear-gradient(180deg, #182234 0%, #0d121c 100%)'
                }}>
                  {filmBackdrop && (
                    <img
                      src={filmBackdrop}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 25%',
                        opacity: 0.55,
                        filter: 'brightness(0.9)'
                      }}
                    />
                  )}

                  {/* Gradient Fade Overlays */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(13, 18, 28, 0.15) 0%, rgba(13, 18, 28, 0.75) 60%, #0d121c 100%)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(13, 18, 28, 0.85) 0%, transparent 40%, transparent 60%, rgba(13, 18, 28, 0.85) 100%)'
                  }} />
                </div>

                {/* 2. Main 3-Column Dossier Content */}
                <div style={{
                  padding: '0 32px 32px 32px',
                  marginTop: '-72px',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <div className="film-dossier-grid">
                    {/* =========================================================
                        COLUMN 1: POSTER & QUICK METADATA (~190px)
                        ========================================================= */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Movie Poster */}
                      <div style={{
                        width: '100%',
                        aspectRatio: '2 / 3',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#0a0d14',
                        boxShadow: '0 16px 36px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12)',
                        flexShrink: 0
                      }}>
                        <PosterImage
                          src={filmPoster}
                          name={filmTitle}
                          year={filmYear}
                        />
                      </div>

                      {/* TMDb Community Rating & Specs Pill */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {filmVoteAverage > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)', fontWeight: '800', fontSize: '13px' }}>
                              <Star size={13} fill="currentColor" />
                              <span>{filmVoteAverage.toFixed(1)} TMDb</span>
                            </div>
                            {filmVoteCount > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                {filmVoteCount.toLocaleString()} votes
                              </span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <Clock size={12} color="var(--text-dim)" />
                          <span>{filmYear || 'N/A'}{filmRuntime ? ` • ${filmRuntime} min` : ''}</span>
                        </div>
                      </div>

                      {/* Interactive Genre Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {filmGenres.map((genreName, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePushGenre(genreName)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.09)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Browse top ${genreName} movies`}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)'; e.currentTarget.style.color = '#06b6d4'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)'; e.currentTarget.style.color = '#cbd5e1'; }}
                          >
                            <Tag size={10} style={{ opacity: 0.7 }} />
                            <span>{genreName}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* =========================================================
                        COLUMN 2: FILM DOSSIER, CAST & DISCOVERY (Center Column)
                        ========================================================= */}
                    <div style={{ minWidth: 0 }}>
                      {/* Title & Clickable Director / Year */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h1 style={{
                            fontSize: '28px',
                            fontWeight: '900',
                            color: '#ffffff',
                            letterSpacing: '-0.025em',
                            lineHeight: '1.2',
                            margin: 0
                          }}>
                            {filmTitle}
                          </h1>

                          {movieLogs.length > 0 && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(251, 54, 64, 0.14)',
                              border: '1px solid rgba(251, 54, 64, 0.35)',
                              color: '#ff5e66',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              <Eye size={11} />
                              <span>{movieLogs.length === 1 ? 'Logged 1x' : `Logged ${movieLogs.length}x`}</span>
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          {/* Clickable Year Tag */}
                          <button
                            type="button"
                            onClick={() => handlePushYear(filmYear)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: '800',
                              padding: 0,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(255, 255, 255, 0.3)'
                            }}
                            title={`Browse best films of ${filmYear}`}
                          >
                            {filmYear || 'N/A'}
                          </button>

                          {filmDirector && filmDirector !== 'Unknown Director' && (
                            <>
                              <span>•</span>
                              <span>Directed by</span>
                              <button
                                type="button"
                                onClick={() => handlePushPerson(filmDirector.split(',')[0].trim(), 'Director')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--accent-ruby)',
                                  fontWeight: '800',
                                  padding: 0,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                                title={`Explore ${filmDirector}'s Director Filmography`}
                              >
                                {filmDirector}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tagline */}
                      {filmTagline && (
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          fontStyle: 'italic',
                          color: '#94a3b8',
                          marginTop: '12px',
                          marginBottom: '10px'
                        }}>
                          "{filmTagline}"
                        </div>
                      )}

                      {/* Full Synopsis */}
                      {filmOverview && (
                        <div style={{
                          fontSize: '14.5px',
                          color: '#cbd5e1',
                          lineHeight: '1.65',
                          marginTop: '14px',
                          marginBottom: '20px'
                        }}>
                          {filmOverview}
                        </div>
                      )}

                      {/* Clickable Cast Chips */}
                      {filmCast.length > 0 && (
                        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <Users size={12} />
                            <span>Top Cast (Click to Explore Filmography)</span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {filmCast.map((actor, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handlePushPerson(actor, 'Actor')}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  padding: '5px 11px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#e2e8f0',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Explore ${actor}'s filmography`}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(251, 54, 64, 0.12)';
                                  e.currentTarget.style.borderColor = 'var(--accent-ruby)';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                  e.currentTarget.style.color = '#e2e8f0';
                                }}
                              >
                                <User size={11} style={{ opacity: 0.6 }} />
                                <span>{actor}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Complete Screening History List */}
                      {sortedLogs.length > 0 && (
                        <div style={{ marginTop: '22px', marginBottom: '24px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px'
                          }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <History size={13} style={{ color: 'var(--accent-ruby)' }} />
                              <span>Your Screening History ({sortedLogs.length})</span>
                            </div>

                            {activeLogId && (
                              <button
                                type="button"
                                onClick={handleSwitchToNewScreening}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--accent-ruby)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: 0
                                }}
                              >
                                <Plus size={12} strokeWidth={3} />
                                <span>Log New Screening</span>
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sortedLogs.map((log, lIdx) => {
                              const isSelected = activeLogId === log.id;
                              const isRewatchLog = log.rewatch || (sortedLogs.length > 1 && lIdx < sortedLogs.length - 1);

                              return (
                                <div
                                  key={log.id || lIdx}
                                  style={{
                                    background: isSelected ? 'rgba(251, 54, 64, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isSelected ? 'var(--accent-ruby)' : 'rgba(255, 255, 255, 0.07)'}`,
                                    borderLeft: `3px solid ${isSelected ? 'var(--accent-ruby)' : 'rgba(255, 255, 255, 0.2)'}`,
                                    borderRadius: '6px',
                                    padding: '12px 14px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                                        <Calendar size={13} style={{ color: isSelected ? 'var(--accent-ruby)' : 'var(--text-dim)' }} />
                                        <span>{formatLogDate(log.date || log.Watched_Date || log.Date)}</span>
                                      </div>

                                      {isRewatchLog && (
                                        <span style={{
                                          fontSize: '10px',
                                          fontWeight: '800',
                                          background: 'rgba(6, 182, 212, 0.15)',
                                          color: '#06b6d4',
                                          padding: '1px 5px',
                                          borderRadius: '3px',
                                          textTransform: 'uppercase'
                                        }}>
                                          Rewatch
                                        </span>
                                      )}

                                      {log.rating && (
                                        <span style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          <Star size={11} fill="currentColor" /> {Number(log.rating).toFixed(1)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons for this specific screening */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectScreeningToEdit(log)}
                                        style={{
                                          background: isSelected ? 'var(--accent-ruby)' : 'rgba(255, 255, 255, 0.06)',
                                          border: 'none',
                                          color: '#ffffff',
                                          borderRadius: '4px',
                                          padding: '3px 8px',
                                          fontSize: '11.5px',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        {isSelected ? 'Editing' : 'Edit'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Delete screening from ${formatLogDate(log.date)}?`)) {
                                            onDeleteFilm(selectedMovie, log.id);
                                            if (activeLogId === log.id) setActiveLogId(null);
                                          }
                                        }}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'var(--text-dim)',
                                          padding: '3px 5px',
                                          cursor: 'pointer'
                                        }}
                                        title="Delete this screening"
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff5e66'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {log.review && (
                                    <div style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '6px', lineHeight: '1.45' }}>
                                      "{log.review}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* "More Like This" Recommendations Rail */}
                      {similarMovies.length > 0 && (
                        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: '12px'
                          }}>
                            <Sparkles size={13} style={{ color: 'var(--accent-ruby)' }} />
                            <span>More Like This</span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                            gap: '12px'
                          }}>
                            {similarMovies.slice(0, 6).map((sim) => {
                              const isSimLogged = (diary || []).some(d => isSameFilm(d, sim));

                              return (
                                <div
                                  key={sim.id}
                                  onClick={() => handlePushFilm(sim)}
                                  style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                  }}
                                  title={`Explore ${sim.title}`}
                                >
                                  <div style={{
                                    width: '100%',
                                    aspectRatio: '2 / 3',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    background: '#090d14',
                                    border: isSimLogged ? '1px solid rgba(251, 54, 64, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    transition: 'transform 0.15s ease'
                                  }}>
                                    <PosterImage
                                      src={sim.posterUrl || sim.poster}
                                      name={sim.title}
                                      year={sim.year}
                                    />
                                  </div>
                                  <div>
                                    <div style={{
                                      fontSize: '11.5px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {sim.title}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                                      {sim.year || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* =========================================================
                        COLUMN 3: LETTERBOXD-STYLE ACTION PANEL (~250px)
                        ========================================================= */}
                    <form 
                      onSubmit={handleSubmit}
                      style={{
                        background: '#090c13',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        height: 'fit-content'
                      }}
                    >
                      {/* Top Action Cluster Toggles (3 Icons: Logged, Liked, Watchlist) */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
                      }}>
                        {/* 1. Logged Toggle */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 4px',
                            borderRadius: '6px',
                            background: isLogged ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isLogged ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: isLogged ? '#10b981' : 'var(--text-muted)',
                            userSelect: 'none'
                          }}
                          title={isLogged ? `Logged in Diary (${movieLogs.length}x)` : "Not yet logged"}
                        >
                          <Eye size={18} strokeWidth={2.2} />
                          <span style={{ fontSize: '10px', fontWeight: '800' }}>
                            {isLogged ? `${movieLogs.length}x LOG` : 'UNLOGGED'}
                          </span>
                        </div>

                        {/* 2. Liked / Favorite Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsFavorite(prev => !prev)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 4px',
                            borderRadius: '6px',
                            background: isFavorite ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isFavorite ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: isFavorite ? '#fb7185' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={isFavorite ? "Favorited Film" : "Mark as Favorite"}
                        >
                          <Heart size={18} fill={isFavorite ? '#fb7185' : 'none'} strokeWidth={2.2} />
                          <span style={{ fontSize: '10px', fontWeight: '800' }}>LIKE</span>
                        </button>

                        {/* 3. Watchlist Toggle */}
                        <button
                          type="button"
                          onClick={() => onToggleWatchlist && onToggleWatchlist(selectedMovie)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 4px',
                            borderRadius: '6px',
                            background: inWatchlist ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${inWatchlist ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: inWatchlist ? '#06b6d4' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          <Clock size={18} strokeWidth={2.2} />
                          <span style={{ fontSize: '10px', fontWeight: '800' }}>
                            {inWatchlist ? 'IN QUEUE' : 'WATCHLIST'}
                          </span>
                        </button>
                      </div>

                      {/* Mode Indicator: Edit Screening vs Log New Screening */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: isEditing ? 'rgba(251, 54, 64, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isEditing ? 'rgba(251, 54, 64, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`
                      }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: isEditing ? '#ff5e66' : '#ffffff' }}>
                          {isEditing ? `Editing Log (${formatLogDate(watchDate)})` : movieLogs.length > 0 ? 'Log Another Screening (Rewatch)' : 'Log First Screening'}
                        </div>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleSwitchToNewScreening}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            + New Log
                          </button>
                        )}
                      </div>

                      {/* Rating Selector */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label className="form-label" style={{ margin: 0, fontSize: '11.5px' }}>Rate Screening</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {rating !== null && rating > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRating(null);
                                  setHoverRating(null);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                              >
                                Clear
                              </button>
                            )}
                            <div style={{
                              color: activeDisplayRating !== null && activeDisplayRating > 0 ? 'var(--accent-gold)' : 'var(--text-muted)',
                              fontWeight: '800',
                              fontSize: '12.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <Star size={12} fill="currentColor" />
                              <span>
                                {activeDisplayRating !== null && activeDisplayRating > 0
                                  ? `${Number(activeDisplayRating).toFixed(1)} / 5.0`
                                  : 'Unrated'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <InteractiveStarRating
                          rating={rating}
                          hoverRating={hoverRating}
                          setRating={setRating}
                          setHoverRating={setHoverRating}
                        />
                      </div>

                      {/* Watch Date */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '11.5px' }}>Watch Date</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ height: '38px', fontSize: '13px' }}
                          value={watchDate}
                          onChange={(e) => setWatchDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Rewatch Toggle Option */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="rewatch-toggle"
                          checked={isRewatch}
                          onChange={(e) => setIsRewatch(e.target.checked)}
                          style={{ accentColor: 'var(--accent-ruby)', cursor: 'pointer' }}
                        />
                        <label 
                          htmlFor="rewatch-toggle" 
                          style={{ fontSize: '12px', color: isRewatch ? '#ffffff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Mark as rewatch / repeated screening
                        </label>
                      </div>

                      {/* Review & Notes */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '11.5px' }}>Review & Notes (Optional)</label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          style={{
                            minHeight: '74px',
                            padding: '8px 10px',
                            lineHeight: '1.45',
                            fontSize: '13px'
                          }}
                          placeholder="Cinematography, mood, personal highlights..."
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            width: '100%',
                            height: '42px',
                            fontSize: '13.5px',
                            background: savedSuccess ? '#10b981' : 'var(--accent-ruby)'
                          }}
                        >
                          {savedSuccess ? (
                            <>
                              <Check size={15} />
                              <span>{isEditing ? 'Screening Updated!' : 'Screening Logged!'}</span>
                            </>
                          ) : isEditing ? (
                            <>
                              <Check size={15} />
                              <span>Update This Screening</span>
                            </>
                          ) : (
                            <>
                              <Plus size={15} strokeWidth={3} />
                              <span>{movieLogs.length > 0 ? 'Log Another Screening' : 'Log This Film'}</span>
                            </>
                          )}
                        </button>

                        {/* Delete Log Option (if editing a specific screening) */}
                        {isEditing ? (
                          !confirmDelete ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(true)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: '1px solid rgba(251, 54, 64, 0.3)',
                                color: '#ff5e66',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 0',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251, 54, 64, 0.12)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Trash2 size={13} />
                              <span>Delete This Screening</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  background: 'var(--accent-ruby)',
                                  border: 'none',
                                  color: '#ffffff',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '8px 0',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Confirm Delete?</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0 10px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNavStack([{ type: 'film', data: null }])}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: '4px 0',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            Find Another Film
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
