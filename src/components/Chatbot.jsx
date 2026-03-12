import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMessageCircle, FiFilm, FiTv, FiTrendingUp, FiStar } from 'react-icons/fi';
import { getTrending, searchMulti, getMovies, getTVShows, getTopRated, getPoster } from '../services/tmdb';
import './Chatbot.css';

// ─── TMDB Genre Map ───────────────────────────────────────────────────────────
const MOVIE_GENRES = {
    action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
    documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
    horror: 27, music: 10402, mystery: 9648, romance: 10749,
    'science fiction': 878, 'sci-fi': 878, scifi: 878, thriller: 53,
    war: 10752, western: 37,
};

const TV_GENRES = {
    action: 10759, animation: 16, comedy: 35, crime: 80, documentary: 99,
    drama: 18, family: 10751, kids: 10762, mystery: 9648, reality: 10764,
    'sci-fi': 10765, scifi: 10765, 'science fiction': 10765,
    war: 10768, western: 37,
};

// ─── Quick-action chips shown in welcome ─────────────────────────────────────
const QUICK_ACTIONS = [
    { label: '🔥 Trending', value: 'trending movies' },
    { label: '⭐ Top Rated', value: 'top rated movies' },
    { label: '😂 Comedy', value: 'recommend comedy movies' },
    { label: '👻 Horror', value: 'recommend horror movies' },
    { label: '🚀 Sci-Fi', value: 'recommend sci-fi movies' },
    { label: '📺 Popular TV', value: 'popular tv shows' },
];

// ─── Intent Parser ────────────────────────────────────────────────────────────
function parseIntent(msg) {
    const lower = msg.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|sup|hiya|howdy)\b/.test(lower))
        return { type: 'greet' };

    // Help
    if (/\b(help|what can you do|capabilities|commands)\b/.test(lower))
        return { type: 'help' };

    // "Tell me about X" / "What is X" / "Info on X" / "Details about X"
    const aboutMatch = lower.match(
        /(?:tell me about|what(?:'s| is)(?: the)?(?: movie| show)?|info(?:rmation)? (?:on|about)|details? (?:on|about)|describe|about)\s+(.+)/
    );
    if (aboutMatch) return { type: 'about', query: aboutMatch[1].trim() };

    // Trending TV
    if (/trending\s+(tv|shows?|series|television)/.test(lower) || /(tv|shows?|series).*trending/.test(lower))
        return { type: 'trending_tv' };

    // Trending Movies
    if (/trending\s*(movies?)?/.test(lower) || /what(?:'s| is)\s+trending/.test(lower))
        return { type: 'trending_movies' };

    // Top rated TV
    if (/top.?rated\s+(tv|shows?|series)/.test(lower) || /(tv|shows?|series).*top.?rated/.test(lower))
        return { type: 'top_rated_tv' };

    // Top rated movies
    if (/top.?rated|best movies?|highest rated/.test(lower))
        return { type: 'top_rated_movies' };

    // Popular TV shows
    if (/popular\s*(tv|shows?|series|television)/.test(lower) || /(tv|shows?|series).*popular/.test(lower))
        return { type: 'popular_tv' };

    // Genre-based TV
    const tvGenreMatch = lower.match(
        /(?:recommend|suggest|show|find|best|top)\s+(.+?)\s+(?:tv\s*shows?|series|television)/
    ) || lower.match(/(.+?)\s+tv\s*shows?\s*(?:recommend|suggest|list)?/);
    if (tvGenreMatch) {
        const genreKey = Object.keys(TV_GENRES).find(g => tvGenreMatch[1].includes(g));
        if (genreKey) return { type: 'genre_tv', genreId: TV_GENRES[genreKey], genreName: genreKey };
    }

    // Genre-based Movies — "recommend/suggest X movies", "X movies", "best X films"
    const movieGenreMatch = lower.match(
        /(?:recommend|suggest|show|find|best|top|give me|list)\s+(.+?)\s+(?:movies?|films?)/
    ) || lower.match(/(.+?)\s+movies?\s*(?:recommend|suggest|please)?$/);
    if (movieGenreMatch) {
        const genreKey = Object.keys(MOVIE_GENRES).find(g => movieGenreMatch[1].includes(g));
        if (genreKey) return { type: 'genre_movie', genreId: MOVIE_GENRES[genreKey], genreName: genreKey };
    }

    // Standalone genre keywords as fallback
    const standaloneGenre = Object.keys(MOVIE_GENRES).find(g => lower.includes(g));
    if (standaloneGenre && /(?:movie|film|watch|recommend|suggest|show|action|horror|sci|thriller|comedy|drama|romance|animation)/.test(lower)) {
        const isTv = /tv|shows?|series/.test(lower);
        return isTv
            ? { type: 'genre_tv', genreId: TV_GENRES[standaloneGenre] || MOVIE_GENRES[standaloneGenre], genreName: standaloneGenre }
            : { type: 'genre_movie', genreId: MOVIE_GENRES[standaloneGenre], genreName: standaloneGenre };
    }

    // Catch-all search
    if (lower.length > 2) return { type: 'search', query: msg.trim() };

    return { type: 'unknown' };
}

// ─── Response text per intent ─────────────────────────────────────────────────
const INTROS = {
    greet: ['Hello! 🎬 What movie magic can I help you find today?', 'Hey there! 🍿 Ready to discover something great?'],
    help: `I can help you with:\n🔍 **Tell me about [movie]** – get details\n🎬 **Recommend action movies** – genre picks\n🔥 **Trending movies / TV shows**\n⭐ **Top rated movies**\n📺 **Popular TV shows**\n\nJust type and I'll find it!`,
    trending_movies: '🔥 Here are this week\'s trending movies:',
    trending_tv: '📺 These TV shows are trending right now:',
    top_rated_movies: '⭐ Highest rated movies on TMDB:',
    top_rated_tv: '⭐ Top rated TV shows:',
    popular_tv: '📺 Most popular TV shows right now:',
};

// ─── Message animation variants ──────────────────────────────────────────────
const msgVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Chatbot({ onMovieClick }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, role: 'bot', type: 'welcome' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    const addMessage = (msg) =>
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);

    const handleQuickAction = (value) => {
        setInput(value);
        setTimeout(() => processMessage(value), 100);
    };

    const processMessage = async (text) => {
        if (!text.trim() || loading) return;
        setInput('');
        addMessage({ role: 'user', type: 'text', text });
        setLoading(true);

        try {
            const intent = parseIntent(text);

            switch (intent.type) {
                case 'greet':
                    addMessage({ role: 'bot', type: 'text', text: INTROS.greet[Math.floor(Math.random() * 2)] });
                    break;

                case 'help':
                    addMessage({ role: 'bot', type: 'text', text: INTROS.help });
                    break;

                case 'about': {
                    const res = await searchMulti(intent.query);
                    const item = res.data.results.find(r => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'));
                    if (!item) {
                        addMessage({ role: 'bot', type: 'text', text: `😔 Couldn't find anything about "${intent.query}". Try checking the spelling!` });
                    } else {
                        const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                        const overview = item.overview ? item.overview.slice(0, 200) + (item.overview.length > 200 ? '...' : '') : 'No overview available.';
                        addMessage({ role: 'bot', type: 'text', text: `📽️ **${item.title || item.name}** (${year})\n⭐ Rating: ${item.vote_average?.toFixed(1)}/10\n\n${overview}` });
                        addMessage({ role: 'bot', type: 'cards', items: [item], label: '👆 Click for full details & trailer' });
                    }
                    break;
                }

                case 'trending_movies': {
                    const res = await getTrending('movie', 'week');
                    const items = res.data.results.filter(i => i.poster_path).slice(0, 6);
                    addMessage({ role: 'bot', type: 'text', text: INTROS.trending_movies });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'movie' })) });
                    break;
                }

                case 'trending_tv': {
                    const res = await getTrending('tv', 'week');
                    const items = res.data.results.filter(i => i.poster_path).slice(0, 6);
                    addMessage({ role: 'bot', type: 'text', text: INTROS.trending_tv });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'tv' })) });
                    break;
                }

                case 'top_rated_movies': {
                    const res = await getTrending('movie', 'week');
                    const items = res.data.results.filter(i => i.poster_path && i.vote_average >= 7).slice(0, 6);
                    addMessage({ role: 'bot', type: 'text', text: INTROS.top_rated_movies });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'movie' })) });
                    break;
                }

                case 'top_rated_tv': {
                    const res = await getTrending('tv', 'week');
                    const items = res.data.results.filter(i => i.poster_path && i.vote_average >= 7).slice(0, 6);
                    addMessage({ role: 'bot', type: 'text', text: INTROS.top_rated_tv });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'tv' })) });
                    break;
                }

                case 'popular_tv': {
                    const res = await getTVShows(1, '');
                    const items = res.data.results.filter(i => i.poster_path).slice(0, 6);
                    addMessage({ role: 'bot', type: 'text', text: INTROS.popular_tv });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'tv' })) });
                    break;
                }

                case 'genre_movie': {
                    const res = await getMovies(1, intent.genreId);
                    const items = res.data.results.filter(i => i.poster_path).slice(0, 6);
                    const name = intent.genreName.replace(/^\w/, c => c.toUpperCase());
                    addMessage({ role: 'bot', type: 'text', text: `🎬 Top **${name}** movies you'll love:` });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'movie' })) });
                    break;
                }

                case 'genre_tv': {
                    const res = await getTVShows(1, intent.genreId);
                    const items = res.data.results.filter(i => i.poster_path).slice(0, 6);
                    const name = intent.genreName.replace(/^\w/, c => c.toUpperCase());
                    addMessage({ role: 'bot', type: 'text', text: `📺 Top **${name}** TV shows for you:` });
                    addMessage({ role: 'bot', type: 'cards', items: items.map(i => ({ ...i, media_type: 'tv' })) });
                    break;
                }

                case 'search': {
                    const res = await searchMulti(intent.query);
                    const items = res.data.results.filter(r => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv')).slice(0, 6);
                    if (items.length === 0) {
                        addMessage({ role: 'bot', type: 'text', text: `😔 No results for "${intent.query}". Try: "recommend horror movies" or "trending TV shows".` });
                    } else {
                        addMessage({ role: 'bot', type: 'text', text: `🔍 Results for **"${intent.query}"**:` });
                        addMessage({ role: 'bot', type: 'cards', items });
                    }
                    break;
                }

                default:
                    addMessage({
                        role: 'bot', type: 'text',
                        text: `🤔 I didn't quite catch that. Try:\n• "Tell me about Inception"\n• "Recommend thriller movies"\n• "Trending TV shows"\n• Type **help** to see all commands!`,
                    });
            }
        } catch {
            addMessage({ role: 'bot', type: 'text', text: '⚠️ Something went wrong. Please try again!' });
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => processMessage(input);

    // Format bold **text** in bot messages
    const renderText = (text) =>
        text.split('\n').map((line, i) => (
            <p key={i}>
                {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
            </p>
        ));

    return (
        <div className="chatbot-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, scale: 0.85, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 24 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-header-info">
                                <div className="chatbot-avatar-wrap">
                                    <span className="chatbot-avatar">🍿</span>
                                    <span className="chatbot-avatar-ring" />
                                </div>
                                <div>
                                    <h4>PopcornBot</h4>
                                    <span className="chatbot-status">
                                        <span className="status-dot" /> Movie Discovery Assistant
                                    </span>
                                </div>
                            </div>
                            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
                                <FiX />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            <AnimatePresence initial={false}>
                                {messages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        className={`chat-message ${msg.role}`}
                                        variants={msgVariants}
                                        initial="hidden"
                                        animate="visible"
                                        layout
                                    >
                                        {msg.role === 'bot' && (
                                            <span className="bot-avatar-small">🍿</span>
                                        )}

                                        <div className="message-content">
                                            {/* Welcome card */}
                                            {msg.type === 'welcome' && (
                                                <div className="welcome-card">
                                                    <div className="welcome-emoji">🎬</div>
                                                    <h5>Hi! I'm PopcornBot</h5>
                                                    <p>Your personal movie discovery assistant. Ask me anything!</p>
                                                    <div className="quick-actions">
                                                        {QUICK_ACTIONS.map(q => (
                                                            <button
                                                                key={q.value}
                                                                className="quick-chip"
                                                                onClick={() => handleQuickAction(q.value)}
                                                            >
                                                                {q.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Text message */}
                                            {msg.type === 'text' && (
                                                <div className="message-bubble">
                                                    {renderText(msg.text)}
                                                </div>
                                            )}

                                            {/* Cards */}
                                            {msg.type === 'cards' && (
                                                <div className="message-cards-wrap">
                                                    {msg.label && <span className="cards-label">{msg.label}</span>}
                                                    <div className="message-cards">
                                                        {msg.items.map((item, idx) => (
                                                            <motion.div
                                                                key={item.id}
                                                                className="chat-card clickable"
                                                                onClick={() => onMovieClick && onMovieClick(item)}
                                                                whileHover={{ scale: 1.03, x: 3 }}
                                                                whileTap={{ scale: 0.97 }}
                                                                initial={{ opacity: 0, x: -12 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.07 }}
                                                            >
                                                                <div className="chat-card-poster-wrap">
                                                                    <img
                                                                        src={getPoster(item.poster_path, 'w185')}
                                                                        alt={item.title || item.name}
                                                                        onError={e => { e.target.src = 'https://via.placeholder.com/80x120/1a1a2e/e94560?text=?'; }}
                                                                    />
                                                                    <div className="chat-card-type-badge">
                                                                        {item.media_type === 'tv' ? <FiTv /> : <FiFilm />}
                                                                    </div>
                                                                </div>
                                                                <div className="chat-card-info">
                                                                    <strong className="chat-card-title">{item.title || item.name}</strong>
                                                                    <div className="chat-card-meta">
                                                                        <span className="chat-card-rating">
                                                                            <FiStar /> {item.vote_average?.toFixed(1)}
                                                                        </span>
                                                                        <span className="chat-card-year">
                                                                            {(item.release_date || item.first_air_date || '').slice(0, 4)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="chat-card-cta">Tap for details →</span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Typing indicator */}
                            {loading && (
                                <motion.div
                                    className="chat-message bot"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="bot-avatar-small">🍿</span>
                                    <div className="message-content">
                                        <div className="message-bubble typing-bubble">
                                            <span className="dot" /><span className="dot" /><span className="dot" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            className="chatbot-input-wrap"
                            onSubmit={e => { e.preventDefault(); handleSend(); }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Ask about movies, genres, trending..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="chatbot-input"
                                disabled={loading}
                                aria-label="Chat input"
                            />
                            <motion.button
                                type="submit"
                                className="chatbot-send"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.88 }}
                                disabled={loading || !input.trim()}
                                aria-label="Send"
                            >
                                <FiSend />
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                className="chatbot-fab"
                onClick={() => setIsOpen(prev => !prev)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open chat"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <FiX />
                        </motion.span>
                    ) : (
                        <motion.span key="chat" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                            <FiMessageCircle />
                        </motion.span>
                    )}
                </AnimatePresence>
                {!isOpen && <span className="fab-pulse" />}
            </motion.button>
        </div>
    );
}
