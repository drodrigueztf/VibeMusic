const { db, admin } = require('../config/db');

const serializeDoc = (doc) => ({ _id: doc.id, ...doc.data() });

const fetchPlaylistSongs = async (playlistData) => {
  let songs = [];
  if (playlistData.songs && playlistData.songs.length > 0) {
    for (let id of playlistData.songs) {
      const songDoc = await db().collection('songs').doc(id).get();
      if(songDoc.exists) {
        songs.push(serializeDoc(songDoc));
      }
    }
  }
  return { ...playlistData, songs };
};

// POST /api/playlists - Create playlist
exports.createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    const newPlaylist = {
      name,
      description: description || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      },
      songs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db().collection('playlists').add(newPlaylist);

    res.status(201).json({ _id: docRef.id, ...newPlaylist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/playlists - Get user's playlists
exports.getMyPlaylists = async (req, res) => {
  try {
    const snapshot = await db().collection('playlists')
      .where('createdBy._id', '==', req.user._id)
      .get();
      
    let playlists = snapshot.docs.map(serializeDoc).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Explicitly fetch songs inside them
    for(let i=0; i<playlists.length; i++) {
      playlists[i] = await fetchPlaylistSongs(playlists[i]);
    }

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/playlists/public - Get public playlists
exports.getPublicPlaylists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const snapshot = await db().collection('playlists')
      .where('isPublic', '==', true)
      .limit(limit)
      .get();

    let playlists = snapshot.docs.map(serializeDoc).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    for(let i=0; i<playlists.length; i++) {
      playlists[i] = await fetchPlaylistSongs(playlists[i]);
    }

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/playlists/:id - Get playlist
exports.getPlaylist = async (req, res) => {
  try {
    const doc = await db().collection('playlists').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    let playlist = serializeDoc(doc);

    // Check if private and not owner
    if (!playlist.isPublic && (!req.user || playlist.createdBy._id !== req.user._id)) {
      return res.status(403).json({ message: 'This playlist is private' });
    }

    playlist = await fetchPlaylistSongs(playlist);

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/playlists/:id - Update playlist
exports.updatePlaylist = async (req, res) => {
  try {
    const playlistRef = db().collection('playlists').doc(req.params.id);
    const doc = await playlistRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    let playlist = serializeDoc(doc);

    if (playlist.createdBy._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, isPublic } = req.body;
    let updates = { updatedAt: new Date().toISOString() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    await playlistRef.update(updates);
    
    Object.assign(playlist, updates);
    playlist = await fetchPlaylistSongs(playlist);

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/playlists/:id/songs - Add/Remove song from playlist
exports.toggleSong = async (req, res) => {
  try {
    const { songId } = req.body;
    const playlistRef = db().collection('playlists').doc(req.params.id);
    const doc = await playlistRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    let playlist = serializeDoc(doc);

    if (playlist.createdBy._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const songIndex = playlist.songs.indexOf(songId);
    let newSongs = [...playlist.songs];
    
    if (songIndex > -1) {
      newSongs.splice(songIndex, 1);
    } else {
      newSongs.push(songId);
    }

    await playlistRef.update({ 
      songs: newSongs,
      updatedAt: new Date().toISOString() 
    });
    
    playlist.songs = newSongs;
    playlist = await fetchPlaylistSongs(playlist);

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/playlists/:id - Delete playlist
exports.deletePlaylist = async (req, res) => {
  try {
    const playlistRef = db().collection('playlists').doc(req.params.id);
    const doc = await playlistRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    let playlist = doc.data();

    if (playlist.createdBy._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await playlistRef.delete();
    
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
