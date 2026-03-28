import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { songsAPI } from '../services/api';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0: off, 1: all, 2: one

  const audio = audioRef.current;

  const playSong = useCallback((song, songList = null, index = -1) => {
    if (!song) return;
    
    const streamUrl = songsAPI.getStreamUrl(song._id);
    audio.src = streamUrl;
    audio.play().catch(console.error);
    setCurrentSong(song);

    if (songList) {
      setQueue(songList);
      setQueueIndex(index >= 0 ? index : songList.findIndex(s => s._id === song._id));
    }
  }, [audio]);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [audio, currentSong, isPlaying]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 1) {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setQueueIndex(nextIndex);
    playSong(queue[nextIndex], queue, nextIndex);
  }, [queue, queueIndex, shuffle, repeat, playSong]);

  const playPrev = useCallback(() => {
    if (currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      if (repeat === 1) {
        prevIndex = queue.length - 1;
      } else {
        audio.currentTime = 0;
        return;
      }
    }

    setQueueIndex(prevIndex);
    playSong(queue[prevIndex], queue, prevIndex);
  }, [queue, queueIndex, currentTime, repeat, audio, playSong]);

  const seek = useCallback((time) => {
    audio.currentTime = time;
    setCurrentTime(time);
  }, [audio]);

  const changeVolume = useCallback((vol) => {
    const newVol = Math.max(0, Math.min(1, vol));
    setVolume(newVol);
    audio.volume = newVol;
  }, [audio]);

  const toggleShuffle = useCallback(() => setShuffle(prev => !prev), []);
  const toggleRepeat = useCallback(() => setRepeat(prev => (prev + 1) % 3), []);

  useEffect(() => {
    audio.volume = volume;
  }, [volume, audio]);

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeat === 2) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audio, repeat, playNext]);

  return (
    <PlayerContext.Provider value={{
      currentSong,
      queue,
      queueIndex,
      isPlaying,
      duration,
      currentTime,
      volume,
      shuffle,
      repeat,
      playSong,
      togglePlay,
      playNext,
      playPrev,
      seek,
      changeVolume,
      toggleShuffle,
      toggleRepeat,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
