const express = require('express');
const router = express.Router();
const {
  uploadSong, getSongs, getSong, streamSong,
  toggleLike, deleteSong, getUserSongs,
  getPopularSongs, getRecentSongs, getSongsByGenre,
  getRecommendations
} = require('../controllers/songController');
const { auth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', auth, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), uploadSong);
router.get('/', getSongs);
router.get('/popular', getPopularSongs);
router.get('/recent', getRecentSongs);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/genre/:genre', getSongsByGenre);
router.get('/user/:userId', getUserSongs);
router.get('/:id', getSong);
router.get('/stream/:id', streamSong);
router.put('/:id/like', auth, toggleLike);
router.delete('/:id', auth, deleteSong);

module.exports = router;
