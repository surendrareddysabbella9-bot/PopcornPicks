import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('popcorn-favorites')) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('popcorn-favorites', JSON.stringify(favorites));
    }, [favorites]);

    const addFavorite = (item) => {
        setFavorites(prev => {
            if (prev.find(f => f.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFavorite = (id) => {
        setFavorites(prev => prev.filter(f => f.id !== id));
    };

    const isFavorite = (id) => favorites.some(f => f.id === id);

    const toggleFavorite = (item) => {
        if (isFavorite(item.id)) removeFavorite(item.id);
        else addFavorite(item);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => useContext(FavoritesContext);
