export const PLAYLISTS_CHANGED_EVENT = 'vibemusic:playlists-changed';

export const emitPlaylistsChanged = () => {
  window.dispatchEvent(new Event(PLAYLISTS_CHANGED_EVENT));
};
