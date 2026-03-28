import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const MEDIA_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibemusic_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Songs
export const songsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/songs?page=${page}&limit=${limit}`),
  getOne: (id) => api.get(`/songs/${id}`),
  getPopular: (limit = 10) => api.get(`/songs/popular?limit=${limit}`),
  getRecent: (limit = 10) => api.get(`/songs/recent?limit=${limit}`),
  getRecommendations: (limit = 10) => api.get(`/songs/recommendations?limit=${limit}`),
  getByGenre: (genre, limit = 20) => api.get(`/songs/genre/${genre}?limit=${limit}`),
  getUserSongs: (userId) => api.get(`/songs/user/${userId}`),
  upload: (formData, onProgress) => api.post('/songs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  toggleLike: (id) => api.put(`/songs/${id}/like`),
  delete: (id) => api.delete(`/songs/${id}`),
  getStreamUrl: (id) => `${API_URL}/songs/stream/${id}`,
};

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${MEDIA_URL}${path}`;
};

// Playlists
export const playlistsAPI = {
  getMine: () => api.get('/playlists'),
  getPublic: (limit = 20) => api.get(`/playlists/public?limit=${limit}`),
  getOne: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  toggleSong: (id, songId) => api.put(`/playlists/${id}/songs`, { songId }),
  delete: (id) => api.delete(`/playlists/${id}`),
};

// Search
export const searchAPI = {
  search: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
};

// Users
export const usersAPI = {
  getProfile: (id) => api.get(`/users/profile/${id}`),
  follow: (id) => api.post(`/users/follow/${id}`),
  unfollow: (id) => api.post(`/users/unfollow/${id}`),
};

export default api;
