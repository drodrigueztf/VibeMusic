import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI, getMediaUrl, songsAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { IoHeart } from 'react-icons/io5';
import DefaultSongCover from '../components/DefaultSongCover';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FavoritesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playSong, currentSong } = usePlayer();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await authAPI.getMe();
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error('Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [user, navigate]);

  const handleUnlike = async (songId) => {
    try {
      await songsAPI.toggleLike(songId);
      setFavorites(prev => prev.filter(s => s._id !== songId));
    } catch (err) {
      console.error('Failed to unlike');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: 'var(--accent-glow)'
        }}>
          <IoHeart />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Liked Songs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{favorites.length} songs</p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="song-list">
          <div className="song-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <span>Duration</span>
            <span></span>
          </div>
          {favorites.map((song, i) => {
            const isCurrent = currentSong?._id === song._id;
            return (
              <div
                key={song._id}
                className={`song-list-item ${isCurrent ? 'playing' : ''}`}
                onClick={() => playSong(song, favorites, i)}
              >
                <span className="song-list-num">{i + 1}</span>
                <div className="song-list-info">
                  {song.coverUrl ? (
                    <img src={getMediaUrl(song.coverUrl)} alt={song.title} className="song-list-cover song-list-cover-image" />
                  ) : (
                    <div className="song-list-cover">
                      <DefaultSongCover
                        title={song.title}
                        artist={song.artist}
                        albumName="Favorites"
                      />
                    </div>
                  )}
                  <div className="song-list-details">
                    <div className="song-list-title">{song.title}</div>
                  </div>
                </div>
                <span className="song-list-album">{song.artist}</span>
                <span className="song-list-duration">{formatTime(song.duration)}</span>
                <button
                  className="song-list-like liked"
                  onClick={(e) => { e.stopPropagation(); handleUnlike(song._id); }}
                >
                  <IoHeart />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💙</div>
          <h3>No liked songs yet</h3>
          <p>Like songs to add them here</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
