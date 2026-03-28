require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { connectDB, db } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

const uploadsDir = path.join(__dirname, '../uploads');
const coversDir = path.join(__dirname, '../uploads/covers');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VibeMusic API is running' });
});

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

const seedDefaultAdmin = async () => {
  if (process.env.SEED_DEFAULT_ADMIN !== 'true') {
    return;
  }

  const snapshot = await db().collection('users').limit(1).get();
  if (!snapshot.empty) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin', salt);
  const defaultUser = {
    username: 'admin',
    email: 'admin@sharkify.com',
    password: hashedPassword,
    avatar: '',
    favorites: [],
    followers: [],
    following: [],
    createdAt: new Date().toISOString()
  };

  await db().collection('users').add(defaultUser);
  console.log('Default account created:');
  console.log('  Email: admin@sharkify.com');
  console.log('  Password: admin');
};

connectDB()
  .then(async () => {
    try {
      await seedDefaultAdmin();
    } catch (err) {
      console.error('Failed to create default account:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`VibeMusic API running on port ${PORT}`);
    });
  });
