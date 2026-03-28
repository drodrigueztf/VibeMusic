import { useEffect, useState, useCallback } from 'react';
import { searchAPI, songsAPI, playlistsAPI } from '../services/api';
import SongCard from '../components/SongCard';
import PlaylistCard from '../components/PlaylistCard';
import { useAuth } from '../context/AuthContext';
import { IoSearch } from 'react-icons/io5';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Reggaeton', 'Latin', 'Indie', 'Lo-Fi', 'Ambient', 'Metal', 'Folk', 'Blues'];

const SearchPage = () => {
  const { user, updateUser } = useAuth();
  const [recentSongs, setRecentSongs] = useState([]);
  const [popularSongs, setPopularSongs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [genreSongs, setGenreSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

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
        console.error('Failed to fetch explore data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const debounceSearch = useCallback(() => {
    let timer;
    return (nextQuery) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (nextQuery.trim().length < 2) {
          setResults([]);
          setSearching(false);
          return;
        }

        setSearching(true);
        try {
          const res = await searchAPI.search(nextQuery);
          setResults(res.data.songs);
        } catch (err) {
          console.error('Search failed');
        } finally {
          setSearching(false);
        }
      }, 300);
    };
  }, []);

  const debouncedSearch = useCallback(debounceSearch(), [debounceSearch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveGenre(null);
    setGenreSongs([]);
    debouncedSearch(value);
  };

  const handleGenreClick = async (genre) => {
    const nextGenre = genre === activeGenre ? null : genre;
    setActiveGenre(nextGenre);
    setQuery('');
    setResults([]);

    if (!nextGenre) {
      setGenreSongs([]);
      return;
    }

    setSearching(true);
    try {
      const res = await songsAPI.getByGenre(nextGenre, 30);
      setGenreSongs(res.data);
    } catch (err) {
      console.error('Genre fetch failed');
    } finally {
      setSearching(false);
    }
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

  const displaySongs = query.trim().length >= 2 ? results : activeGenre ? genreSongs : [];

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: 8,
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Explore
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Discover music, trending tracks, and public playlists
      </p>

      <div className="search-page-input-container">
        <IoSearch className="search-page-icon" />
        <input
          className="search-page-input"
          type="text"
          placeholder="Search for songs, artists, or genres..."
          value={query}
          onChange={handleInputChange}
        />
      </div>

      <div className="genre-tags">
        {GENRES.map((genre) => (
          <button
            key={genre}
            className={`genre-tag ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => handleGenreClick(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {searching && (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      )}

      {!searching && displaySongs.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              {query ? `Results for "${query}"` : `${activeGenre} Songs`}
            </h2>
            <span className="section-link">{displaySongs.length} songs</span>
          </div>
          <div className="cards-grid">
            {displaySongs.map((song, i) => (
              <SongCard
                key={song._id}
                song={song}
                songList={displaySongs}
                index={i}
                onToggleLike={user ? handleToggleLike : undefined}
                isLiked={favoriteIds.includes(song._id)}
              />
            ))}
          </div>
        </div>
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
            {publicPlaylists.map((playlist) => (
              <PlaylistCard key={playlist._id} playlist={playlist} />
            ))}
          </div>
        </div>
      )}

      {recentSongs.length === 0 && popularSongs.length === 0 && recommendations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎶</div>
          <h3>No music yet</h3>
          <p>There is nothing to explore yet.</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
