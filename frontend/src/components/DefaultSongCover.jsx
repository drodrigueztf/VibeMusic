const truncateText = (value, fallback) => {
  const text = (value || fallback || '').trim();
  return text.length > 28 ? `${text.slice(0, 28)}...` : text;
};

const DefaultSongCover = ({ title, artist, albumName, className = '' }) => {
  const safeAlbum = truncateText(albumName, 'Default Track');
  const safeArtist = truncateText(artist, 'Artist Name');
  const safeTitle = truncateText(title, 'Song Title');

  return (
    <div className={`default-song-cover ${className}`.trim()}>
      <div className="default-song-cover__header">
        <h1>{safeAlbum}</h1>
      </div>

      <div className="default-song-cover__icon">
        <div className="default-song-cover__waveform" />
      </div>

      <div className="default-song-cover__info">
        <div className="default-song-cover__artist">{safeArtist}</div>
        <h2 className="default-song-cover__title">{safeTitle}</h2>
      </div>

      <div className="default-song-cover__footer">
        {safeAlbum}
        <br />
        (c) 2026 VibeMusic | Track
      </div>
    </div>
  );
};

export default DefaultSongCover;
