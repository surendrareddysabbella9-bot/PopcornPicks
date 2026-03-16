import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FiPlay, FiInfo, FiStar } from 'react-icons/fi';
import { getBackdrop } from '../services/tmdb';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './HeroCarousel.css';

export default function HeroCarousel({ items = [], onCardClick }) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="hero-carousel">
            <Swiper
                modules={[Autoplay, EffectFade, Navigation, Pagination]}
                effect="fade"
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation
                loop
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                className="hero-swiper"
            >
                {items.map((item, index) => {
                    const backdrop = getBackdrop(item.backdrop_path);
                    const title = item.title || item.name;
                    const rating = item.vote_average?.toFixed(1);
                    const year = (item.release_date || item.first_air_date || '').slice(0, 4);

                    return (
                        <SwiperSlide key={item.id}>
                            <div
                                className="hero-slide"
                                style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
                            >
                                <div className="hero-gradient" />
                                <div className="hero-content">
                                    <motion.div
                                        key={activeIndex}
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                    >
                                        <div className="hero-badges">
                                            {item.media_type === 'tv' ? (
                                                <span className="hero-badge tv">📺 TV Show</span>
                                            ) : (
                                                <span className="hero-badge movie">🎬 Movie</span>
                                            )}
                                            {rating && (
                                                <span className="hero-badge rating"><FiStar /> {rating}</span>
                                            )}
                                            {year && <span className="hero-badge year">{year}</span>}
                                        </div>
                                        <h1 className="hero-title">{title}</h1>
                                        <p className="hero-overview">
                                            {item.overview?.slice(0, 180)}{item.overview?.length > 180 ? '...' : ''}
                                        </p>
                                        <div className="hero-actions">
                                            <motion.button
                                                className="hero-btn primary"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onCardClick(item)}
                                            >
                                                <FiPlay /> Watch Trailer
                                            </motion.button>
                                            <motion.button
                                                className="hero-btn secondary"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onCardClick(item)}
                                            >
                                                <FiInfo /> More Info
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}
