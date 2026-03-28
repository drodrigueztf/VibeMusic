import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { songsAPI, playlistsAPI } from '../services/api';
import SongCard from '../components/SongCard';
import PlaylistCard from '../components/PlaylistCard';
import { useNavigate } from 'react-router-dom';
import { IoAdd } from 'react-icons/io5';
import { emitPlaylistsChanged } from '../utils/playlistEvents';

const LibraryPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('songs');
  const [mySongs, setMySongs] = useState([]);
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizedFavorites = (user?.favorites || []).map((favorite) =>
      typeof favorite === 'string' ? favorite : favorite._id
    );
    setFavoriteIds(normalizedFavorites.filter(Boolean));
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [songsRes, playlistsRes] = await Promise.all([
          songsAPI.getUserSongs(user._id),
          playlistsAPI.getMine(),
        ]);
        setMySongs(songsRes.data);
        setMyPlaylists(playlistsRes.data);
      } catch (err) {
        console.error('Failed to fetch library');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  const handleCreatePlaylist = async () => {
    try {
      const res = await playlistsAPI.create({
        name: `My Playlist #${myPlaylists.length + 1}`,
      });
      setMyPlaylists(prev => [res.data, ...prev]);
      emitPlaylistsChanged();
      navigate(`/playlist/${res.data._id}`);
    } catch (err) {
      console.error('Failed to create playlist');
    }
  };

  const handleDeleteSong = async (song) => {
    if (!window.confirm(`Delete "${song.title}"?`)) return;

    try {
      await songsAPI.delete(song._id);
      setMySongs((prev) => prev.filter((item) => item._id !== song._id));
    } catch (err) {
      console.error('Failed to delete song');
    }
  };

  const handleToggleLike = async (song) => {
    try {
      const res = await songsAPI.toggleLike(song._id);
      setFavoriteIds((prev) => (
        res.data.liked
          ? [...prev, song._id]
          : prev.filter((id) => id !== song._id)
      ));

      if (user) {
        const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];
        const nextFavorites = res.data.liked
          ? [...currentFavorites, song]
          : currentFavorites.filter((favorite) => {
              const favoriteId = typeof favorite === 'string' ? favorite : favorite._id;
              return favoriteId !== song._id;
            });
        updateUser({ ...user, favorites: nextFavorites });
      }
    } catch (err) {
      console.error('Failed to toggle like');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Your Library</h1>

      <div className="library-tabs">
        <button
          className={`library-tab ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => setActiveTab('songs')}
        >
          My Songs
        </button>
        <button
          className={`library-tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
        </button>
      </div>

      {activeTab === 'songs' && (
        <>
          {mySongs.length > 0 ? (
            <div className="cards-grid">
              {mySongs.map((song, i) => (
                <SongCard
                  key={song._id}
                  song={song}
                  songList={mySongs}
                  index={i}
                  onDelete={handleDeleteSong}
                  onToggleLike={handleToggleLike}
                  isLiked={favoriteIds.includes(song._id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎵</div>
              <h3>No songs uploaded yet</h3>
              <p>Upload your first track to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                Upload Music
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'playlists' && (
        <>
          <button
            className="btn btn-secondary"
            onClick={handleCreatePlaylist}
            style={{ marginBottom: 20 }}
          >
            <IoAdd /> Create Playlist
          </button>
          {myPlaylists.length > 0 ? (
            <div className="cards-grid">
              {myPlaylists.map(pl => (
                <PlaylistCard key={pl._id} playlist={pl} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No playlists yet</h3>
              <p>Create your first playlist</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;
