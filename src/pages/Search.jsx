import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import { searchMulti, getTrending, getPoster } from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import { SkeletonRow } from '../components/SkeletonCard';
import './Page.css';
import './Search.css';

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [showSug, setShowSug] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searched, setSearched] = useState(!!initialQuery);
    const debounceRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        getTrending('all', 'week').then(res => {
            setTrending(res.data.results.slice(0, 12));
            setTrendingLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (initialQuery) performSearch(initialQuery);
    }, []);

    const performSearch = async (q) => {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        setShowSug(false);
        try {
            const res = await searchMulti(q);
            setResults(res.data.results.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (!val.trim()) { setSuggestions([]); setShowSug(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await searchMulti(val);
                setSuggestions(res.data.results.filter(r => r.poster_path).slice(0, 6));
                setShowSug(true);
            } catch { setSuggestions([]); }
        }, 300);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSearchParams(query ? { q: query } : {});
        performSearch(query);
    };

    const handleSuggestionClick = (item) => {
        const name = item.title || item.name;
        setQuery(name);
        setShowSug(false);
        setSearchParams({ q: name });
        performSearch(name);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setSearched(false);
        setSuggestions([]);
        setSearchParams({});
        inputRef.current?.focus();
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
                <div className="search-hero">
                    <h1 className="page-hero-title">🔍 Search</h1>
                    <p className="page-hero-subtitle">Find movies, shows, and more</p>

                    <form onSubmit={handleSubmit} className="search-page-form">
                        <div className="search-page-input-wrap">
                            <FiSearch className="spi-icon" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search movies, TV shows..."
                                value={query}
                                onChange={handleInput}
                                onFocus={() => suggestions.length && setShowSug(true)}
                                className="search-page-input"
                                autoFocus
                            />
                            {query && (
                                <button type="button" className="spi-clear" onClick={clearSearch}><FiX /></button>
                            )}
                        </div>
                        <button type="submit" className="search-page-btn">Search</button>

                        <AnimatePresence>
                            {showSug && suggestions.length > 0 && (
                                <motion.div
                                    className="search-page-suggestions"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >
                                    {suggestions.map(item => (
                                        <div key={item.id} className="sps-item" onClick={() => handleSuggestionClick(item)}>
                                            <img src={getPoster(item.poster_path, 'w92')} alt="" />
                                            <div>
                                                <strong>{item.title || item.name}</strong>
                                                <span>{item.media_type === 'movie' ? '🎬 Movie' : '📺 TV'} · ⭐ {item.vote_average?.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {loading && <SkeletonRow count={12} />}

                {!loading && searched && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">
                                {results.length > 0 ? `🎯 Results for "${query}" (${results.length})` : `😔 No results for "${query}"`}
                            </h2>
                        </div>
                        {results.length > 0 ? (
                            <div className="media-grid">
                                {results.map((item, i) => (
                                    <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                        <MediaCard item={item} onClick={setSelectedItem} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p style={{ fontSize: '3rem' }}>🎬</p>
                                <h3>Nothing found</h3>
                                <p>Try a different search term or browse trending below</p>
                            </div>
                        )}
                    </div>
                )}

                {!searched && !loading && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">🔥 Trending Now</h2>
                        </div>
                        {trendingLoading ? <SkeletonRow count={12} /> : (
                            <div className="media-grid">
                                {trending.map((item, i) => (
                                    <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <MediaCard item={item} onClick={setSelectedItem} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </motion.div>
    );
}
