import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getTVShows, getGenres } from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import GenreFilter from '../components/GenreFilter';
import { SkeletonRow } from '../components/SkeletonCard';
import './Page.css';

export default function TVSeries() {
    const [shows, setShows] = useState([]);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        getGenres('tv').then(res => setGenres(res.data.genres)).catch(console.error);
    }, []);

    useEffect(() => {
        setShows([]);
        setPage(1);
        fetchShows(1, selectedGenre, true);
    }, [selectedGenre]);

    const fetchShows = useCallback(async (pageNum, genre, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const res = await getTVShows(pageNum, genre);
            const newShows = res.data.results.filter(s => s.poster_path);
            setShows(prev => reset ? newShows : [...prev, ...newShows]);
            setTotalPages(res.data.total_pages);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setLoadingMore(false); }
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchShows(nextPage, selectedGenre);
    };

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
                    <h1 className="page-hero-title">📺 TV Series</h1>
                    <p className="page-hero-subtitle">Discover the best TV shows from around the world</p>
                </div>

                <GenreFilter genres={genres} selectedGenre={selectedGenre} onSelect={setSelectedGenre} />

                {loading ? <SkeletonRow count={12} /> : (
                    <>
                        <div className="media-grid">
                            {shows.map((item, i) => (
                                <motion.div
                                    key={`${item.id}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i % 12) * 0.04 }}
                                >
                                    <MediaCard item={{ ...item, media_type: 'tv' }} onClick={setSelectedItem} />
                                </motion.div>
                            ))}
                        </div>
                        {page < totalPages && (
                            <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                                {loadingMore ? 'Loading...' : '⬇ Load More Shows'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </motion.div>
    );
}
