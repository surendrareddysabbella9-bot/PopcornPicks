import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiSearch, FiX, FiMenu, FiBookmark } from 'react-icons/fi';
import { MdLocalMovies, MdLiveTv, MdTrendingUp } from 'react-icons/md';
import { searchMulti, getPoster } from '../services/tmdb';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await searchMulti(val);
                const filtered = res.data.results
                    .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
                    .slice(0, 6);
                setSuggestions(filtered);
                setShowSuggestions(true);
            } catch { setSuggestions([]); }
        }, 350);
    };

    const handleSuggestionClick = (item) => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        navigate(`/search?q=${encodeURIComponent(item.title || item.name)}`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
    };

    const navLinks = [
        { to: '/', icon: <MdTrendingUp />, label: 'Trending' },
        { to: '/movies', icon: <MdLocalMovies />, label: 'Movies' },
        { to: '/tv', icon: <MdLiveTv />, label: 'TV Series' },
        { to: '/watchlist', icon: <FiBookmark />, label: 'Watchlist' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <span className="logo-icon">🍿</span>
                    <span className="logo-text">PopcornPicks</span>
                </Link>

                <div className="nav-links desktop-only">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                </div>

                <div className="nav-actions">
                    <form onSubmit={handleSearchSubmit} className="search-container" ref={searchRef}>
                        <div className="search-input-wrap">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search movies, shows..."
                                value={query}
                                onChange={handleSearch}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                className="search-input"
                            />
                            {query && (
                                <button type="button" className="search-clear" onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                                    <FiX />
                                </button>
                            )}
                        </div>
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    className="suggestions-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {suggestions.map(item => (
                                        <div key={item.id} className="suggestion-item" onClick={() => handleSuggestionClick(item)}>
                                            <img src={getPoster(item.poster_path, 'w92')} alt={item.title || item.name} />
                                            <div className="suggestion-info">
                                                <span className="suggestion-title">{item.title || item.name}</span>
                                                <span className="suggestion-type">{item.media_type === 'movie' ? '🎬 Movie' : '📺 TV Show'}</span>
                                            </div>
                                            <span className="suggestion-rating">⭐ {item.vote_average?.toFixed(1)}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <motion.button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        whileTap={{ scale: 0.85, rotate: 20 }}
                        title="Toggle theme"
                    >
                        {isDark ? <FiSun /> : <FiMoon />}
                    </motion.button>
                </div>
            </div>

            {/* Mobile Bottom Navigation (App-like) */}
            <div className="bottom-nav mobile-only">
                {navLinks.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`bottom-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                    >
                        <span className="bottom-icon">{link.icon}</span>
                        <span className="bottom-label">{link.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
