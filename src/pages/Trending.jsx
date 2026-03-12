import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTrending } from '../services/tmdb';
import HeroCarousel from '../components/HeroCarousel';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import { SkeletonRow } from '../components/SkeletonCard';
import './Page.css';

export default function Trending() {
    const [heroItems, setHeroItems] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [allRes, moviesRes, tvRes] = await Promise.all([
                    getTrending('all', 'week'),
                    getTrending('movie', 'week'),
                    getTrending('tv', 'week'),
                ]);
                setHeroItems(allRes.data.results.slice(0, 8));
                setTrendingMovies(moviesRes.data.results.slice(0, 12));
                setTrendingTV(tvRes.data.results.slice(0, 12));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    return (
        <motion.div
            className="page-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            {heroItems.length > 0 && (
                <HeroCarousel items={heroItems} onCardClick={setSelectedItem} />
            )}

            <div className="content-section">
                <div className="section-header">
                    <h2 className="section-title">🔥 Trending Movies</h2>
                </div>
                {loading ? <SkeletonRow count={6} /> : (
                    <div className="media-grid">
                        {trendingMovies.map(item => (
                            <MediaCard key={item.id} item={{ ...item, media_type: 'movie' }} onClick={setSelectedItem} />
                        ))}
                    </div>
                )}

                <div className="section-header" style={{ marginTop: '40px' }}>
                    <h2 className="section-title">📺 Trending TV Shows</h2>
                </div>
                {loading ? <SkeletonRow count={6} /> : (
                    <div className="media-grid">
                        {trendingTV.map(item => (
                            <MediaCard key={item.id} item={{ ...item, media_type: 'tv' }} onClick={setSelectedItem} />
                        ))}
                    </div>
                )}
            </div>

            {selectedItem && (
                <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </motion.div>
    );
}
