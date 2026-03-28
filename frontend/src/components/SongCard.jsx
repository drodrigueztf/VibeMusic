import { usePlayer } from '../context/PlayerContext';
import { IoHeart, IoHeartOutline, IoPlay, IoTrash } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { getEntityProfileId } from '../utils/profile';
import { getMediaUrl } from '../services/api';
import DefaultSongCover from './DefaultSongCover';

const SongCard = ({ song, songList, index, onDelete, onToggleLike, isLiked = false }) => {
  const { playSong, currentSong } = usePlayer();
  const isCurrentSong = currentSong?._id === song._id;
  const profileId = getEntityProfileId(song.uploadedBy);

  const handlePlay = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    playSong(song, songList, index);
  };

  return (
    <div className={`song-card ${isCurrentSong ? 'playing' : ''}`} onClick={handlePlay}>
      <div className="song-card-cover">
        {song.coverUrl ? (
          <img src={getMediaUrl(song.coverUrl)} alt={song.title} className="song-card-cover-image" />
        ) : (
          <DefaultSongCover
            title={song.title}
            artist={song.artist}
            albumName={song.genre || 'VibeMusic'}
          />
        )}
        {onDelete && (
          <button
            className="song-card-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(song);
            }}
            title="Delete song"
          >
            <IoTrash />
          </button>
        )}
      </div>
      <div className="song-card-title-row">
        <div className="song-card-title">{song.title}</div>
        <button type="button" className="song-card-play-btn-inline" onClick={handlePlay}>
          <IoPlay style={{ marginLeft: 2 }} />
        </button>
      </div>
      <div
        className="song-card-artist user-link"
        onClick={(e) => e.stopPropagation()}
      >
        {onToggleLike && (
          <button
            className={`song-card-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(song);
            }}
            title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isLiked ? <IoHeart /> : <IoHeartOutline />}
          </button>
        )}
        <div className="song-card-artist-main">
          {profileId ? <Link to={`/profile/${profileId}`}>{song.artist}</Link> : <span>{song.artist}</span>}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
