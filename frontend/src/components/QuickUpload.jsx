import { useState, useRef, useEffect } from 'react';
import { IoCloudUpload, IoPlay, IoPause, IoClose, IoImageOutline } from 'react-icons/io5';
import { songsAPI } from '../services/api';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Reggaeton', 'Latin', 'Country', 'Metal', 'Indie', 'Folk', 'Blues', 'Punk', 'Lo-Fi', 'Ambient', 'Other'];

const QuickUpload = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Other');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (previewUrl) {
      audio.src = previewUrl;
    }
    
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [previewUrl]);

  const togglePreview = (e) => {
    e.preventDefault();
    if (!previewUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setTitle('');
    setArtist('');
    setCover(null);
    setIsPlaying(false);
    setProgress(0);
    setError(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    if (audioRef.current) audioRef.current.pause();
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Only MP3 and WAV files are allowed');
      return;
    }
    
    clearSelection();
    setFile(selectedFile);
    setError(null);
    
    // Create local preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Auto-fill
    const name = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = () => setDragging(true);
  const handleDragLeave = () => setDragging(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !artist) {
      setError('Please fill in required fields');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);
    if (cover) formData.append('cover', cover);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('genre', genre);

    setUploading(true);
    setError(null);

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      const res = await songsAPI.upload(formData, (pe) => {
        setUploadProgress(Math.round((pe.loaded * 100) / pe.total));
      });
      
      clearSelection();
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="quick-upload-widget" style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '40px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--glass-shadow)'
    }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IoCloudUpload style={{ color: 'var(--accent-primary)' }}/> Creator Studio: Quick Upload
      </h2>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <IoCloudUpload size={40} color="var(--text-tertiary)" style={{ marginBottom: 8 }}/>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Drop your audio here to preview & upload</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>MP3, WAV up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp3"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* File Preview Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            background: 'rgba(0, 212, 255, 0.05)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20
          }}>
            <button 
              type="button"
              onClick={togglePreview}
              style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0
              }}
            >
              {isPlaying ? <IoPause /> : <IoPlay style={{ marginLeft: 3 }} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Previewing: {file.name}
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 2 }} />
              </div>
            </div>
            <button type="button" onClick={clearSelection} style={{ color: 'var(--text-tertiary)', padding: 8 }}>
              <IoClose size={24} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Title *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Artist *</label>
              <input className="input" value={artist} onChange={e => setArtist(e.target.value)} required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Genre</label>
              <select className="select" value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Cover</label>
            <div className="upload-cover-row">
              <label className="upload-cover-picker">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const selectedFile = e.target.files[0];
                    if (!selectedFile) return;
                    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!allowed.includes(selectedFile.type)) {
                      setError('Only JPEG, PNG and WebP cover images are allowed');
                      return;
                    }
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCover(selectedFile);
                    setCoverPreview(URL.createObjectURL(selectedFile));
                    setError(null);
                  }}
                />
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="upload-cover-preview" />
                ) : (
                  <div className="upload-cover-placeholder">
                    <IoImageOutline />
                    <span>Add cover</span>
                  </div>
                )}
              </label>
              {cover && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCover(null);
                    setCoverPreview(null);
                  }}
                >
                  <IoClose /> Remove
                </button>
              )}
            </div>
          </div>

          {uploading && (
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 16 }}>
              <div style={{ height: '100%', background: 'var(--accent-gradient)', borderRadius: 2, width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? `Publishing... ${uploadProgress}%` : 'Publish Track'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default QuickUpload;
