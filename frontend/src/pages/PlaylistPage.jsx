import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMediaUrl, playlistsAPI, songsAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import DefaultSongCover from '../components/DefaultSongCover';
import { emitPlaylistsChanged } from '../utils/playlistEvents';
import {
  IoPlay,
  IoTrash,
  IoPencil,
  IoMusicalNotes,
  IoHeartOutline,
  IoAdd,
  IoClose,
  IoSearch,
} from 'react-icons/io5';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlaylistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong, currentSong } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [availableSongs, setAvailableSongs] = useState([]);
  const [songQuery, setSongQuery] = useState('');
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [addingSongId, setAddingSongId] = useState('');

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await playlistsAPI.getOne(id);
        setPlaylist(res.data);
        setEditName(res.data.name);
        setEditDesc(res.data.description || '');
      } catch (err) {
        console.error('Failed to fetch playlist');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  const isOwner = user && playlist?.createdBy?._id === user._id;

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs, 0);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistsAPI.delete(id);
      emitPlaylistsChanged();
      navigate('/library');
    } catch (err) {
      console.error('Failed to delete playlist');
    }
  };

  const handleSave = async () => {
    try {
      const res = await playlistsAPI.update(id, { name: editName, description: editDesc });
      setPlaylist(res.data);
      emitPlaylistsChanged();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update playlist');
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const res = await playlistsAPI.toggleSong(id, songId);
      setPlaylist(res.data);
    } catch (err) {
      console.error('Failed to remove song');
    }
  };

  const handleToggleLike = async (songId) => {
    try {
      await songsAPI.toggleLike(songId);
    } catch (err) {
      console.error('Failed to toggle like');
    }
  };

  const handleOpenAddSongs = async () => {
    setShowAddSongs(true);
    if (availableSongs.length > 0) return;

    try {
      setLoadingSongs(true);
      const res = await songsAPI.getAll(1, 100);
      setAvailableSongs(res.data.songs || []);
    } catch (err) {
      console.error('Failed to fetch songs');
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleAddSong = async (songId) => {
    try {
      setAddingSongId(songId);
      const res = await playlistsAPI.toggleSong(id, songId);
      setPlaylist(res.data);
    } catch (err) {
      console.error('Failed to add song');
    } finally {
      setAddingSongId('');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!playlist) {
    return (
      <div className="empty-state">
        <h3>Playlist not found</h3>
      </div>
    );
  }

  const playlistSongIds = new Set(playlist.songs.map((song) => song._id));
  const normalizedQuery = songQuery.trim().toLowerCase();
  const songsToAdd = availableSongs.filter((song) => {
    if (playlistSongIds.has(song._id)) return false;
    if (!normalizedQuery) return true;

    return (
      song.title?.toLowerCase().includes(normalizedQuery) ||
      song.artist?.toLowerCase().includes(normalizedQuery) ||
      song.genre?.toLowerCase().includes(normalizedQuery)
    );
  });

  const renderSongCover = (song) => {
    if (song.coverUrl) {
      return <img src={getMediaUrl(song.coverUrl)} alt={song.title} className="song-list-cover song-list-cover-image" />;
    }

    return (
      <div className="song-list-cover">
        <DefaultSongCover
          title={song.title}
          artist={song.artist}
          albumName={playlist.name}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="playlist-header">
        <div className="playlist-header-cover">
          <IoMusicalNotes />
        </div>
        <div className="playlist-header-info">
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Playlist
          </p>
          {editing ? (
            <div style={{ marginBottom: 12 }}>
              <input
                className="input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}
              />
              <input
                className="input"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Add a description..."
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={handleSave}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{playlist.name}</h1>
              {playlist.description && (
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>{playlist.description}</p>
              )}
            </>
          )}
          <div className="playlist-header-meta">
            {playlist.createdBy?.username} • {playlist.songs.length} songs
          </div>
          <div className="playlist-header-actions">
            <button className="btn btn-primary" onClick={handlePlayAll} disabled={playlist.songs.length === 0}>
              <IoPlay /> Play All
            </button>
            {isOwner && (
              <>
                <button className="btn btn-secondary" onClick={handleOpenAddSongs}>
                  <IoAdd /> Add Songs
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  <IoPencil /> Edit
                </button>
                <button className="btn btn-danger" onClick={handleDeletePlaylist}>
                  <IoTrash /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {playlist.songs.length > 0 ? (
        <div className="song-list">
          <div className="song-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <span>Duration</span>
            <span></span>
          </div>
          {playlist.songs.map((song, i) => {
            const isCurrent = currentSong?._id === song._id;
            return (
              <div
                key={song._id}
                className={`song-list-item ${isCurrent ? 'playing' : ''}`}
                onClick={() => playSong(song, playlist.songs, i)}
              >
                <span className="song-list-num">{i + 1}</span>
                <div className="song-list-info">
                  {renderSongCover(song)}
                  <div className="song-list-details">
                    <div className="song-list-title">{song.title}</div>
                    <div className="song-list-artist-name">{song.uploadedBy?.username}</div>
                  </div>
                </div>
                <span className="song-list-album">{song.artist}</span>
                <span className="song-list-duration">{formatTime(song.duration)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {user && (
                    <button
                      className="song-list-like"
                      onClick={(e) => { e.stopPropagation(); handleToggleLike(song._id); }}
                    >
                      <IoHeartOutline />
                    </button>
                  )}
                  {isOwner && (
                    <button
                      className="song-list-like"
                      onClick={(e) => { e.stopPropagation(); handleRemoveSong(song._id); }}
                      title="Remove from playlist"
                    >
                      <IoTrash />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <h3>This playlist is empty</h3>
          <p>Add songs from your library or search</p>
          {isOwner && (
            <button className="btn btn-primary" onClick={handleOpenAddSongs}>
              <IoAdd /> Add Songs
            </button>
          )}
        </div>
      )}

      {showAddSongs && (
        <div className="modal-overlay" onClick={() => setShowAddSongs(false)}>
          <div className="modal playlist-song-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Songs</h2>
              <button className="modal-close" onClick={() => setShowAddSongs(false)}>
                <IoClose />
              </button>
            </div>

            <div className="search-page-input-container playlist-song-search">
              <IoSearch className="search-page-icon" />
              <input
                className="search-page-input"
                value={songQuery}
                onChange={(e) => setSongQuery(e.target.value)}
                placeholder="Search by title, artist, or genre"
              />
            </div>

            {loadingSongs ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : songsToAdd.length > 0 ? (
              <div className="playlist-song-picker">
                {songsToAdd.map((song) => (
                  <div key={song._id} className="playlist-song-picker-item">
                    <div className="playlist-song-picker-main">
                      {renderSongCover(song)}
                      <div className="playlist-song-picker-details">
                        <div className="song-list-title">{song.title}</div>
                        <div className="song-list-artist-name">
                          {song.artist}{song.genre ? ` • ${song.genre}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAddSong(song._id)}
                      disabled={addingSongId === song._id}
                    >
                      <IoAdd /> {addingSongId === song._id ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state playlist-song-empty">
                <div className="empty-state-icon">🎵</div>
                <h3>No songs available</h3>
                <p>All songs are already in this playlist or no matches were found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistPage;
