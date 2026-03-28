const path = require('path');
const { db, admin } = require('../config/db');

const serializeDoc = (doc) => ({ _id: doc.id, ...doc.data() });

const getBucket = () => admin.storage().bucket();

const buildStoragePath = (file, folder) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  return `${folder}/${uniqueName}`;
};

const uploadBufferToStorage = async (file, folder) => {
  const storagePath = buildStoragePath(file, folder);
  const bucketFile = getBucket().file(storagePath);

  await bucketFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000',
    }
  });

  const [signedUrl] = await bucketFile.getSignedUrl({
    action: 'read',
    expires: '03-01-2500',
  });

  return {
    storagePath,
    url: signedUrl,
  };
};

const deleteFromStorage = async (storagePath) => {
  if (!storagePath) {
    return;
  }

  try {
    await getBucket().file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    console.error(`Failed to delete storage object ${storagePath}:`, error.message);
  }
};

const getRemoteFileSize = async (storagePath) => {
  const [metadata] = await getBucket().file(storagePath).getMetadata();
  return Number(metadata.size || 0);
};

// POST /api/songs - Upload a new song
exports.uploadSong = async (req, res) => {
  const audioFile = req.files?.audio?.[0];
  const coverFile = req.files?.cover?.[0];
  let uploadedAudio;
  let uploadedCover;

  try {
    if (!audioFile) {
      return res.status(400).json({ message: 'Please upload an audio file' });
    }

    const { title, artist, genre, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    uploadedAudio = await uploadBufferToStorage(audioFile, 'songs');
    if (coverFile) {
      uploadedCover = await uploadBufferToStorage(coverFile, 'covers');
    }

    const newSong = {
      title,
      artist,
      genre: genre || 'Other',
      duration: duration || 0,
      fileName: audioFile.originalname,
      filePath: uploadedAudio.storagePath,
      coverUrl: uploadedCover ? uploadedCover.url : '',
      coverPath: uploadedCover ? uploadedCover.storagePath : '',
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
    await deleteFromStorage(uploadedAudio?.storagePath);
    await deleteFromStorage(uploadedCover?.storagePath);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/songs - Get all songs
exports.getSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const songsRef = db().collection('songs');
    const snapshot = await songsRef.orderBy('createdAt', 'desc').offset(offset).limit(limit).get();
    const allDocs = await songsRef.get();
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
    const limit = parseInt(req.query.limit, 10) || 10;
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
    const limit = parseInt(req.query.limit, 10) || 10;
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
    const limit = parseInt(req.query.limit, 10) || 20;
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
    const limit = parseInt(req.query.limit, 10) || 10;
    let recommendations = [];

    if (req.user && req.user.favorites && req.user.favorites.length > 0) {
      // Simplified recommendation strategy for Firestore.
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
    if (!song.filePath) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const remoteFile = getBucket().file(song.filePath);
    const fileSize = await getRemoteFileSize(song.filePath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });

      remoteFile.createReadStream({ start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });

      remoteFile.createReadStream().pipe(res);
    }

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
      song.likes = song.likes.filter((id) => id !== userId);
    } else {
      await songRef.update({
        likes: admin.firestore.FieldValue.arrayUnion(userId)
      });
      await userRef.update({
        favorites: admin.firestore.FieldValue.arrayUnion(song._id)
      });
      if (!song.likes) song.likes = [];
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

    if (song.uploadedBy._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await deleteFromStorage(song.filePath);
    await deleteFromStorage(song.coverPath);

    await songRef.delete();

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

    res.json(snapshot.docs.map(serializeDoc).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
