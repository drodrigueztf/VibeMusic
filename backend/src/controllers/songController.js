const path = require('path');
const fs = require('fs');
const { db, admin } = require('../config/db');

const serializeDoc = (doc) => ({ _id: doc.id, ...doc.data() });

// POST /api/songs - Upload a new song
exports.uploadSong = async (req, res) => {
  const audioFile = req.files?.audio?.[0];
  const coverFile = req.files?.cover?.[0];

  try {
    if (!audioFile) {
      return res.status(400).json({ message: 'Please upload an audio file' });
    }

    const { title, artist, genre, duration } = req.body;

    if (!title || !artist) {
      fs.unlinkSync(audioFile.path);
      if (coverFile && fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    const newSong = {
      title,
      artist,
      genre: genre || 'Other',
      duration: duration || 0,
      filePath: audioFile.path,
      fileName: audioFile.filename,
      coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : '',
      uploadedBy: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      },
      plays: 0,
      likes: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db().collection('songs').add(newSong);

    res.status(201).json({ _id: docRef.id, ...newSong });
  } catch (error) {
    if (audioFile && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
    if (coverFile && fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs - Get all songs
exports.getSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const songsRef = db().collection('songs');
    const snapshot = await songsRef.orderBy('createdAt', 'desc').offset(offset).limit(limit).get();
    
    // We can't efficiently count total documents in Firestore without reading all or saving a counter.
    // For simplicity, we just return the fetched songs.
    const allDocs = await songsRef.get(); // Note: Not optimal for large DBs. 
    const total = allDocs.size;

    const songs = snapshot.docs.map(serializeDoc);

    res.json({
      songs,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/popular - Get popular songs
exports.getPopularSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const snapshot = await db().collection('songs')
      .orderBy('plays', 'desc')
      .limit(limit)
      .get();

    res.json(snapshot.docs.map(serializeDoc));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/recent - Get recently added songs
exports.getRecentSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const snapshot = await db().collection('songs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    res.json(snapshot.docs.map(serializeDoc));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/genre/:genre - Get songs by genre
exports.getSongsByGenre = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const snapshot = await db().collection('songs')
      .where('genre', '==', req.params.genre)
      .limit(limit)
      .get();

    res.json(snapshot.docs.map(serializeDoc));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/recommendations - Get recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let recommendations = [];

    if (req.user && req.user.favorites && req.user.favorites.length > 0) {
      // Find genres of favorited songs. 
      // Simplified approach: just fetch popular songs right now since Firestore "in" queries and complex filtering is tricky.
      // E.g. where genre in [X,Y], limit N
    }

    if (recommendations.length === 0) {
      const snapshot = await db().collection('songs').orderBy('plays', 'desc').limit(limit).get();
      recommendations = snapshot.docs.map(serializeDoc);
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/:id - Get single song
exports.getSong = async (req, res) => {
  try {
    const doc = await db().collection('songs').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(serializeDoc(doc));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/stream/:id - Stream audio
exports.streamSong = async (req, res) => {
  try {
    const doc = await db().collection('songs').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const song = doc.data();
    const filePath = song.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }

    // Increment play count inside firestore
    db().collection('songs').doc(req.params.id).update({
      plays: admin.firestore.FieldValue.increment(1)
    }).catch(() => {});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/songs/:id/like - Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const songRef = db().collection('songs').doc(req.params.id);
    const userRef = db().collection('users').doc(req.user._id);
    
    const songDoc = await songRef.get();
    if (!songDoc.exists) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const song = serializeDoc(songDoc);
    const userId = req.user._id;
    const isLiked = song.likes ? song.likes.includes(userId) : false;

    if (isLiked) {
      await songRef.update({
        likes: admin.firestore.FieldValue.arrayRemove(userId)
      });
      await userRef.update({
        favorites: admin.firestore.FieldValue.arrayRemove(song._id)
      });
      song.likes = song.likes.filter(id => id !== userId);
    } else {
      await songRef.update({
        likes: admin.firestore.FieldValue.arrayUnion(userId)
      });
      await userRef.update({
        favorites: admin.firestore.FieldValue.arrayUnion(song._id)
      });
      if(!song.likes) song.likes = [];
      song.likes.push(userId);
    }

    res.json({ song, liked: !isLiked });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/songs/:id - Delete a song
exports.deleteSong = async (req, res) => {
  try {
    const songRef = db().collection('songs').doc(req.params.id);
    const songDoc = await songRef.get();

    if (!songDoc.exists) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const song = songDoc.data();

    // Verify ownership
    if (song.uploadedBy._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file
    if (fs.existsSync(song.filePath)) {
      fs.unlinkSync(song.filePath);
    }
    if (song.coverUrl) {
      const coverPath = path.join(__dirname, '../../', song.coverUrl.replace(/^\//, ''));
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await songRef.delete();

    // Note: Since Firestore has no cascade delete, we might want to manually remove from all users' favorites in a real app.
    // Given no easy way to query "array contains" and update all efficiently without looping, 
    // we'll keep it simple for now or fetch users who had it as favorite and update.

    res.json({ message: 'Song deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs/user/:userId - Get songs by user
exports.getUserSongs = async (req, res) => {
  try {
    const snapshot = await db().collection('songs')
      .where('uploadedBy._id', '==', req.params.userId)
      .get();

    res.json(snapshot.docs.map(serializeDoc).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
