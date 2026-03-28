import { useState, useEffect } from 'react';
import { songsAPI, playlistsAPI } from '../services/api';
import SongCard from '../components/SongCard';
import PlaylistCard from '../components/PlaylistCard';
import { useAuth } from '../context/AuthContext';
import QuickUpload from '../components/QuickUpload';

const HomePage = () => {
  const { user, updateUser } = useAuth();
  const [recentSongs, setRecentSongs] = useState([]);
  const [popularSongs, setPopularSongs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizedFavorites = (user?.favorites || []).map((favorite) =>
      typeof favorite === 'string' ? favorite : favorite._id
    );
    setFavoriteIds(normalizedFavorites.filter(Boolean));
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, popularRes, recRes, playlistRes] = await Promise.all([
          songsAPI.getRecent(12),
          songsAPI.getPopular(12),
          songsAPI.getRecommendations(12),
          playlistsAPI.getPublic(8),
        ]);
        setRecentSongs(recentRes.data);
        setPopularSongs(popularRes.data);
        setRecommendations(recRes.data);
        setPublicPlaylists(playlistRes.data);
      } catch (err) {
        console.error('Failed to fetch home data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUploadSuccess = (newSong) => {
    setRecentSongs((prev) => [newSong, ...prev].slice(0, 12));
  };

  const handleToggleLike = async (song) => {
    if (!user) return;

    try {
      const res = await songsAPI.toggleLike(song._id);
      setFavoriteIds((prev) => (
        res.data.liked
          ? [...prev, song._id]
          : prev.filter((id) => id !== song._id)
      ));

      const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];
      const nextFavorites = res.data.liked
        ? [...currentFavorites, song]
        : currentFavorites.filter((favorite) => {
            const favoriteId = typeof favorite === 'string' ? favorite : favorite._id;
            return favoriteId !== song._id;
          });
      updateUser({ ...user, favorites: nextFavorites });
    } catch (err) {
      console.error('Failed to toggle like');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {user ? `Creator Dashboard • ${user.username}` : 'Welcome to VibeMusic 🎵'}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        {user ? 'Upload, preview, and manage your music' : 'Discover and enjoy your favorite music'}
      </p>

      {user && (
        <QuickUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {recommendations.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recommended for You</h2>
          </div>
          <div className="cards-grid">
            {recommendations.map((song, i) => (
              <SongCard
                key={song._id}
                song={song}
                songList={recommendations}
                index={i}
                onToggleLike={user ? handleToggleLike : undefined}
                isLiked={favoriteIds.includes(song._id)}
              />
            ))}
          </div>
        </div>
      )}

      {recentSongs.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recently Added</h2>
          </div>
          <div className="cards-grid">
            {recentSongs.map((song, i) => (
              <SongCard
                key={song._id}
                song={song}
                songList={recentSongs}
                index={i}
                onToggleLike={user ? handleToggleLike : undefined}
                isLiked={favoriteIds.includes(song._id)}
              />
            ))}
          </div>
        </div>
      )}

      {popularSongs.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Popular Tracks</h2>
          </div>
          <div className="cards-grid">
            {popularSongs.map((song, i) => (
              <SongCard
                key={song._id}
                song={song}
                songList={popularSongs}
                index={i}
                onToggleLike={user ? handleToggleLike : undefined}
                isLiked={favoriteIds.includes(song._id)}
              />
            ))}
          </div>
        </div>
      )}

      {publicPlaylists.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Public Playlists</h2>
          </div>
          <div className="cards-grid">
            {publicPlaylists.map(pl => (
              <PlaylistCard key={pl._id} playlist={pl} />
            ))}
          </div>
        </div>
      )}

      {recentSongs.length === 0 && popularSongs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎶</div>
          <h3>No music yet</h3>
          {user ? <p>Be the first to upload a track using the Studio above!</p> : <p>Log in to upload the first track!</p>}
        </div>
      )}
    </div>
  );
};

export default HomePage;
