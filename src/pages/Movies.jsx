import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getMovies, getGenres } from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import GenreFilter from '../components/GenreFilter';
import { SkeletonRow } from '../components/SkeletonCard';
import './Page.css';

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        getGenres('movie').then(res => setGenres(res.data.genres)).catch(console.error);
    }, []);

    useEffect(() => {
        setMovies([]);
        setPage(1);
        fetchMovies(1, selectedGenre, true);
    }, [selectedGenre]);

    const fetchMovies = useCallback(async (pageNum, genre, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const res = await getMovies(pageNum, genre);
            const newMovies = res.data.results.filter(m => m.poster_path);
            setMovies(prev => reset ? newMovies : [...prev, ...newMovies]);
            setTotalPages(res.data.total_pages);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setLoadingMore(false); }
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMovies(nextPage, selectedGenre);
    };

    const handleGenreSelect = (genreId) => {
        setSelectedGenre(genreId);
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
                    <h1 className="page-hero-title">🎬 Movies</h1>
                    <p className="page-hero-subtitle">Explore thousands of movies across all genres</p>
                </div>

                <GenreFilter genres={genres} selectedGenre={selectedGenre} onSelect={handleGenreSelect} />

                {loading ? <SkeletonRow count={12} /> : (
                    <>
                        <div className="media-grid">
                            {movies.map((item, i) => (
                                <motion.div
                                    key={`${item.id}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i % 12) * 0.04 }}
                                >
                                    <MediaCard item={{ ...item, media_type: 'movie' }} onClick={setSelectedItem} />
                                </motion.div>
                            ))}
                        </div>
                        {page < totalPages && (
                            <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                                {loadingMore ? <><span className="spinner-sm" /> Loading...</> : '⬇ Load More Movies'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </motion.div>
    );
}
