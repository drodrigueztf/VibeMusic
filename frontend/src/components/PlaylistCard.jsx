import { useNavigate, Link } from 'react-router-dom';
import { IoMusicalNotes } from 'react-icons/io5';
import { getEntityDisplayName, getEntityProfileId } from '../utils/profile';

const mosaicAccents = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#ff7a18',
  '#17c964',
];

const buildMosaicTiles = (songs = []) => {
  const selectedSongs = songs.slice(0, 4);

  if (selectedSongs.length === 0) {
    return [{
      key: 'placeholder',
      accent: 'var(--bg-tertiary)',
      title: 'VibeMusic',
      empty: true,
    }];
  }

  return Array.from({ length: 4 }, (_, index) => {
    const song = selectedSongs[index];
    const accent = mosaicAccents[index % mosaicAccents.length];

    return {
      key: song?._id || `placeholder-${index}`,
      accent,
      title: song?.title || 'VibeMusic',
      empty: !song,
    };
  });
};

const PlaylistCard = ({ playlist }) => {
  const navigate = useNavigate();
  const profileId = getEntityProfileId(playlist.createdBy);
  const authorName = getEntityDisplayName(playlist.createdBy);
  const mosaicTiles = buildMosaicTiles(playlist.songs);

  return (
    <div className="playlist-card" onClick={() => navigate(`/playlist/${playlist._id}`)}>
      <div className="playlist-card-cover">
        <div className="playlist-card-mosaic" aria-hidden="true">
          {mosaicTiles.map((tile) => (
            <div
              key={tile.key}
              className={`playlist-card-mosaic-tile ${tile.empty ? 'placeholder' : ''} ${mosaicTiles.length === 1 ? 'single' : ''}`}
              style={{ '--tile-accent': tile.accent }}
              title={tile.title}
            >
              <div className="playlist-card-mosaic-mini" aria-hidden="true">
                
              </div>
            </div>
          ))}
          <div className="playlist-card-mosaic-badge">
            <IoMusicalNotes />
          </div>
        </div>
      </div>
      <div className="playlist-card-title">{playlist.name}</div>
      <div
        className="playlist-card-author user-link"
        onClick={(e) => e.stopPropagation()}
      >
        by {profileId ? <Link to={`/profile/${profileId}`}>{authorName}</Link> : authorName}
      </div>
      <div className="playlist-card-count">
        {playlist.songs?.length || 0} songs
      </div>
    </div>
  );
};

export default PlaylistCard;
