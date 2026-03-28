const express = require('express');
const router = express.Router();
const {
  createPlaylist, getMyPlaylists, getPublicPlaylists,
  getPlaylist, updatePlaylist, toggleSong, deletePlaylist
} = require('../controllers/playlistController');
const { auth, optionalAuth } = require('../middleware/auth');

router.post('/', auth, createPlaylist);
router.get('/', auth, getMyPlaylists);
router.get('/public', getPublicPlaylists);
router.get('/:id', optionalAuth, getPlaylist);
router.put('/:id', auth, updatePlaylist);
router.put('/:id/songs', auth, toggleSong);
router.delete('/:id', auth, deletePlaylist);

module.exports = router;
