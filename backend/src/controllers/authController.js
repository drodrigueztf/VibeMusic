const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper function to handle password checking
const comparePassword = async (candidatePassword, hash) => {
  return bcrypt.compare(candidatePassword, hash);
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const usersRef = db().collection('users');
    
    // Check if user exists (email or username)
    const emailQuery = await usersRef.where('email', '==', email.toLowerCase()).get();
    const usernameQuery = await usersRef.where('username', '==', username).get();

    if (!emailQuery.empty) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (!usernameQuery.empty) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: '',
      favorites: [],
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await usersRef.add(newUser);
    const token = generateToken(docRef.id);

    res.status(201).json({
      user: {
        _id: docRef.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const usersRef = db().collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await comparePassword(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(userDoc.id);

    res.json({
      user: {
        _id: userDoc.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const userRef = db().collection('users').doc(req.user._id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = doc.data();
    delete userData.password;

    // Fetch favorites explicitly from Firestore
    let populatedFavorites = [];
    if (userData.favorites && userData.favorites.length > 0) {
      const songsRef = db().collection('songs');
      // Firestore 'in' query supports up to 10 items. For more, need chunks.
      // Simple loop for safety:
      for (let songId of userData.favorites) {
        const songDoc = await songsRef.doc(songId).get();
        if (songDoc.exists) {
            populatedFavorites.push({ _id: songDoc.id, ...songDoc.data() });
        }
      }
    }
    
    userData.favorites = populatedFavorites;

    res.json({ _id: doc.id, ...userData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
