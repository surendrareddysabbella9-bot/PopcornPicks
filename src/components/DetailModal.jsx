import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBookmark, FiStar, FiCalendar, FiPlay } from 'react-icons/fi';
import { MdBookmark, MdBookmarkBorder } from 'react-icons/md';
import { getDetails, getVideos, getBackdrop, getPoster } from '../services/tmdb';
import { useFavorites } from '../context/FavoritesContext';
import './DetailModal.css';

export default function DetailModal({ item, onClose }) {
    const [details, setDetails] = useState(null);
    const [trailer, setTrailer] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isFavorite, toggleFavorite } = useFavorites();

    const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv');
    const fav = details ? isFavorite(details.id) : false;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [detailRes, videoRes] = await Promise.all([
                    getDetails(mediaType, item.id),
                    getVideos(mediaType, item.id),
                ]);
                setDetails(detailRes.data);
                const trailerVideo = videoRes.data.results.find(
                    v => v.type === 'Trailer' && v.site === 'YouTube'
                ) || videoRes.data.results.find(v => v.site === 'YouTube');
                setTrailer(trailerVideo);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [item.id, mediaType]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const title = details?.title || details?.name || item.title || item.name;
    const backdrop = getBackdrop(details?.backdrop_path || item.backdrop_path);
    const genres = details?.genres || [];
    const overview = details?.overview || item.overview || 'No overview available.';
    const rating = details?.vote_average?.toFixed(1) || item.vote_average?.toFixed(1);
    const releaseDate = details?.release_date || details?.first_air_date || '';
    const runtime = details?.runtime ? `${details.runtime} min` : details?.episode_run_time?.[0] ? `${details.episode_run_time[0]} min/ep` : null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="modal-content"
                    onClick={e => e.stopPropagation()}
                    initial={{ scale: 0.8, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 40 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <button className="modal-close" onClick={onClose}><FiX /></button>

                    <div className="modal-backdrop" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}>
                        <div className="modal-backdrop-gradient" />
                    </div>

                    {loading ? (
                        <div className="modal-loading">
                            <div className="modal-spinner" />
                            <p>Loading details...</p>
                        </div>
                    ) : (
                        <div className="modal-body">
                            <div className="modal-poster-wrap">
                                <img
                                    src={getPoster(details?.poster_path || item.poster_path)}
                                    alt={title}
                                    className="modal-poster"
                                    onError={e => { e.target.src = 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=No+Image'; }}
                                />
                            </div>

                            <div className="modal-info">
                                <h2 className="modal-title">{title}</h2>

                                <div className="modal-meta">
                                    {rating && (
                                        <span className="modal-rating"><FiStar /> {rating}/10</span>
                                    )}
                                    {releaseDate && (
                                        <span className="modal-date"><FiCalendar /> {releaseDate}</span>
                                    )}
                                    {runtime && <span className="modal-runtime">⏱ {runtime}</span>}
                                    <span className={`modal-type ${mediaType}`}>
                                        {mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                                    </span>
                                </div>

                                {genres.length > 0 && (
                                    <div className="modal-genres">
                                        {genres.map(g => (
                                            <span key={g.id} className="genre-chip">{g.name}</span>
                                        ))}
                                    </div>
                                )}

                                <p className="modal-overview">{overview}</p>

                                {details?.credits?.cast?.length > 0 && (
                                    <div className="modal-cast">
                                        <span className="cast-label">Cast: </span>
                                        {details.credits.cast.slice(0, 5).map(c => c.name).join(', ')}
                                    </div>
                                )}

                                <div className="modal-actions">
                                    {trailer && (
                                        <a
                                            href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-trailer"
                                        >
                                            <FiPlay /> Watch Trailer
                                        </a>
                                    )}
                                    <button
                                        className={`btn-watchlist ${fav ? 'active' : ''}`}
                                        onClick={() => toggleFavorite({ ...item, ...details, media_type: mediaType })}
                                    >
                                        {fav ? <MdBookmark /> : <MdBookmarkBorder />}
                                        {fav ? 'In Watchlist' : 'Add to Watchlist'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
