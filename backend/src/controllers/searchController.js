const { db } = require('../config/db');

// GET /api/search?q=term
exports.search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const snapshot = await db().collection('songs').get();
    const queryLower = q.trim().toLowerCase();
    
    // In-memory filter as Firestore doesn't provide partial text matching over multiple fields well
    const songs = snapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .filter(song => 
        (song.title && song.title.toLowerCase().includes(queryLower)) ||
        (song.artist && song.artist.toLowerCase().includes(queryLower)) ||
        (song.genre && song.genre.toLowerCase().includes(queryLower))
      );

    // Sort by plays
    songs.sort((a,b) => (b.plays || 0) - (a.plays || 0));

    res.json({ songs: songs.slice(0, 50), query: q, total: songs.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
