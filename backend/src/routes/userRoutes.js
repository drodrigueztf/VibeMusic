const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/profile/:id', userController.getUserProfile);
router.post('/follow/:id', auth, userController.followUser);
router.post('/unfollow/:id', auth, userController.unfollowUser);

module.exports = router;
