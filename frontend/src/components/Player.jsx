import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl, songsAPI } from '../services/api';
import { useState } from 'react';
import DefaultSongCover from './DefaultSongCover';
import {
  IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack,
  IoShuffle, IoRepeat, IoVolumeHigh, IoVolumeMedium,
  IoVolumeLow, IoVolumeMute, IoHeart, IoHeartOutline
} from 'react-icons/io5';

const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Player = () => {
  const {
    currentSong, isPlaying, duration, currentTime, volume,
    shuffle, repeat, togglePlay, playNext, playPrev, seek,
    changeVolume, toggleShuffle, toggleRepeat
  } = usePlayer();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    changeVolume(percent);
  };

  const handleLike = async () => {
    if (!currentSong || !user) return;
    try {
      const res = await songsAPI.toggleLike(currentSong._id);
      setLiked(res.data.liked);
    } catch (err) {
      console.error('Failed to toggle like');
    }
  };

  const VolumeIcon = volume === 0 ? IoVolumeMute
    : volume < 0.3 ? IoVolumeLow
    : volume < 0.7 ? IoVolumeMedium
    : IoVolumeHigh;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`player-bar ${!currentSong ? 'no-song' : ''}`}>
      <div className="player-song-info">
        {currentSong ? (
          <>
            {currentSong.coverUrl ? (
              <img src={getMediaUrl(currentSong.coverUrl)} alt={currentSong.title} className="player-cover" />
            ) : (
              <div className="player-cover-placeholder">
                <DefaultSongCover
                  title={currentSong.title}
                  artist={currentSong.artist}
                  albumName="Now Playing"
                />
              </div>
            )}
            <div className="player-song-details">
              <div className="player-song-title">{currentSong.title}</div>
              <div className="player-song-artist">{currentSong.artist}</div>
            </div>
            {user && (
              <button className={`player-like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                {liked ? <IoHeart /> : <IoHeartOutline />}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="player-cover-placeholder" style={{ opacity: 0.3 }}>
              <DefaultSongCover
                title="Song Title"
                artist="Artist Name"
                albumName="VibeMusic"
              />
            </div>
            <div className="player-song-details">
              <div className="player-song-title" style={{ color: 'var(--text-tertiary)' }}>No song playing</div>
              <div className="player-song-artist">Select a song to play</div>
            </div>
          </>
        )}
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className={`player-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
            <IoShuffle />
          </button>
          <button className="player-btn" onClick={playPrev}>
            <IoPlaySkipBack />
          </button>
          <button className="player-btn-play" onClick={togglePlay}>
            {isPlaying ? <IoPause /> : <IoPlay style={{ marginLeft: 2 }} />}
          </button>
          <button className="player-btn" onClick={playNext}>
            <IoPlaySkipForward />
          </button>
          <button className={`player-btn ${repeat > 0 ? 'active' : ''}`} onClick={toggleRepeat}>
            <IoRepeat />
            {repeat === 2 && <span style={{ fontSize: '0.6rem', position: 'absolute', marginTop: 12 }}>1</span>}
          </button>
        </div>
        <div className="player-progress">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div className="progress-bar-container" onClick={handleProgressClick}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-extra">
        <div className="volume-container">
          <button className="volume-btn" onClick={() => changeVolume(volume === 0 ? 0.7 : 0)}>
            <VolumeIcon />
          </button>
          <div className="volume-slider" onClick={handleVolumeClick}>
            <div className="volume-slider-fill" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
