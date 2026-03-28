require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const coversDir = path.join(__dirname, '../uploads/covers');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VibeMusic API is running 🎵' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max size is 50MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;

const { db } = require('./config/db');
const bcrypt = require('bcryptjs');

connectDB().then(async () => {
  try {
    const snapshot = await db().collection('users').limit(1).get();
    if (snapshot.empty) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      const defaultUser = {
        username: 'admin',
        email: 'admin@sharkify.com',
        password: hashedPassword,
        avatar: '',
        favorites: [],
        createdAt: new Date().toISOString()
      };
      await db().collection('users').add(defaultUser);
      console.log('✅ Default account created:');
      console.log('   Email: admin@sharkify.com');
      console.log('   Password: admin');
    }
  } catch (err) {
    console.error('❌ Failed to create default account:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🎵 VibeMusic API running on port ${PORT}`);
  });
});
