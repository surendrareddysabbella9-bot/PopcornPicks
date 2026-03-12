import axios from 'axios';

const READ_ACCESS_TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

// Use /api proxy path so browser talks to localhost (avoids network blocks)
const BASE_URL = '/api/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${READ_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const IMAGE_BASE = '/tmdb-image/t/p';

export const getPoster = (path, size = 'w500') =>
  path ? `${IMAGE_BASE}/${size}${path}` : '/no-poster.png';

export const getBackdrop = (path, size = 'original') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

export const getTrending = (type = 'all', timeWindow = 'week') =>
  tmdb.get(`/trending/${type}/${timeWindow}`);

export const getMovies = (page = 1, genreId = '') =>
  tmdb.get('/discover/movie', {
    params: { page, with_genres: genreId, sort_by: 'popularity.desc' },
  });

export const getTVShows = (page = 1, genreId = '') =>
  tmdb.get('/discover/tv', {
    params: { page, with_genres: genreId, sort_by: 'popularity.desc' },
  });

export const searchMulti = (query, page = 1) =>
  tmdb.get('/search/multi', { params: { query, page } });

export const getDetails = (type, id) =>
  tmdb.get(`/${type}/${id}`, { params: { append_to_response: 'credits' } });

export const getVideos = (type, id) =>
  tmdb.get(`/${type}/${id}/videos`);

export const getGenres = (type = 'movie') =>
  tmdb.get(`/genre/${type}/list`);

export const getSimilar = (type, id, page = 1) =>
  tmdb.get(`/${type}/${id}/similar`, { params: { page } });

export const getTopRated = (type = 'movie', page = 1) =>
  tmdb.get(`/${type}/top_rated`, { params: { page } });

export default tmdb;
