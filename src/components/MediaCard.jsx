import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookmark, FiBookmark as FiBookmarkFilled, FiStar, FiPlay, FiInfo } from 'react-icons/fi';
import { MdBookmark, MdBookmarkBorder } from 'react-icons/md';
import { getPoster } from '../services/tmdb';
import { useFavorites } from '../context/FavoritesContext';
import './MediaCard.css';

export default function MediaCard({ item, onClick }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const [ripples, setRipples] = useState([]);

    const title = item.title || item.name || 'Unknown';
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv');
    const fav = isFavorite(item.id);

    const handleRipple = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples(prev => [...prev, { x, y, id }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    };

    const handleFav = (e) => {
        e.stopPropagation();
        handleRipple(e);
        toggleFavorite({ ...item, media_type: mediaType });
    };

    return (
        <motion.div
            className="media-card"
            onClick={() => onClick(item)}
            whileHover={{ y: -8, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            layout
        >
            <div className="card-poster-wrap">
                <img
                    src={getPoster(item.poster_path)}
                    alt={title}
                    className="card-poster"
                    loading="lazy"
                    onError={e => { e.target.src = 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=No+Image'; }}
                />
                <div className="card-overlay">
                    <motion.button
                        className="card-btn play-btn"
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onClick(item); }}
                        title="View Details"
                    >
                        <FiPlay /> Details
                    </motion.button>
                    <motion.button
                        className={`card-btn fav-btn ${fav ? 'active' : ''}`}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleFav}
                        title={fav ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                        {fav ? <MdBookmark /> : <MdBookmarkBorder />}
                        {ripples.map(r => (
                            <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
                        ))}
                    </motion.button>
                </div>
                <div className="card-rating">
                    <FiStar /> {rating}
                </div>
                <div className={`card-type-badge ${mediaType}`}>
                    {mediaType === 'movie' ? '🎬' : '📺'}
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title" title={title}>{title}</h3>
                <span className="card-year">{year}</span>
            </div>
        </motion.div>
    );
}
