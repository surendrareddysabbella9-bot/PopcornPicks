import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdBookmark, MdDelete } from 'react-icons/md';
import { useFavorites } from '../context/FavoritesContext';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import './Page.css';

export default function Watchlist() {
    const { favorites, removeFavorite } = useFavorites();
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <motion.div
            className="page-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="content-section">
                <div className="page-hero">
                    <h1 className="page-hero-title">🔖 My Watchlist</h1>
                    <p className="page-hero-subtitle">
                        {favorites.length > 0 ? `${favorites.length} title${favorites.length !== 1 ? 's' : ''} saved` : 'Start adding movies and shows to your watchlist!'}
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="empty-state">
                        <p style={{ fontSize: '4rem', marginBottom: '16px' }}>🍿</p>
                        <h3>Your watchlist is empty</h3>
                        <p>Browse trending movies and TV shows and add them to your watchlist!</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div className="media-grid">
                            {favorites.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <MediaCard item={item} onClick={setSelectedItem} />
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </motion.div>
    );
}
