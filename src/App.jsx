import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import DetailModal from './components/DetailModal';
import Trending from './pages/Trending';
import Movies from './pages/Movies';
import TVSeries from './pages/TVSeries';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Trending />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/tv" element={<TVSeries />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [globalSelectedItem, setGlobalSelectedItem] = useState(null);

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <Navbar />
          <AnimatedRoutes />
          <Chatbot onMovieClick={setGlobalSelectedItem} />
          {globalSelectedItem && (
            <DetailModal item={globalSelectedItem} onClose={() => setGlobalSelectedItem(null)} />
          )}
        </BrowserRouter>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
