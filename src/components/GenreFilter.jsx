import { motion } from 'framer-motion';
import './GenreFilter.css';

export default function GenreFilter({ genres, selectedGenre, onSelect }) {
    return (
        <div className="genre-filter">
            <motion.button
                className={`genre-chip ${selectedGenre === '' ? 'active' : ''}`}
                onClick={() => onSelect('')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                All
            </motion.button>
            {genres.map(genre => (
                <motion.button
                    key={genre.id}
                    className={`genre-chip ${selectedGenre === genre.id ? 'active' : ''}`}
                    onClick={() => onSelect(genre.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {genre.name}
                </motion.button>
            ))}
        </div>
    );
}
