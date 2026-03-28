import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsAPI } from '../services/api';
import { IoCloudUpload, IoMusicalNote, IoClose, IoImageOutline } from 'react-icons/io5';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Reggaeton', 'Latin', 'Country', 'Metal', 'Indie', 'Folk', 'Blues', 'Punk', 'Lo-Fi', 'Ambient', 'Other'];

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
      if (!allowed.includes(selectedFile.type)) {
        setError('Only MP3 and WAV files are allowed');
        return;
      }
      setFile(selectedFile);
      setError(null);
      // Auto-fill title from filename
      if (!title) {
        const name = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(name);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !artist) {
      setError('Please fill in all required fields and select a file');
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
      await songsAPI.upload(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });
      navigate('/library');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCoverSelect = (selectedFile) => {
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
  };

  return (
    <div className="upload-page">
      <h1>Upload Music</h1>
      <p>Share your music with the world</p>

      {error && <div className="auth-error">{error}</div>}

      {/* Drop zone */}
      {!file && (
        <div
          className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-dropzone-icon"><IoCloudUpload /></div>
          <h3>Drag & drop your audio file here</h3>
          <p>or click to browse • MP3, WAV up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp3"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
        </div>
      )}

      {/* File info */}
      {file && (
        <div className="upload-file-info">
          <IoMusicalNote />
          <div style={{ flex: 1 }}>
            <div className="upload-file-name">{file.name}</div>
            <div className="upload-file-size">{formatSize(file.size)}</div>
          </div>
          <button onClick={() => setFile(null)} style={{ color: 'var(--text-tertiary)' }}>
            <IoClose size={20} />
          </button>
        </div>
      )}

      {file && (
        <div className="input-group">
          <label>Cover</label>
          <div className="upload-cover-row">
            <label className="upload-cover-picker">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleCoverSelect(e.target.files[0])}
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
                  setCoverPreview('');
                }}
              >
                <IoClose /> Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Metadata form */}
      {file && (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Title *</label>
            <input
              className="input"
              type="text"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Artist *</label>
            <input
              className="input"
              type="text"
              placeholder="Artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Genre</label>
            <select className="select" value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={uploading}
            style={{ width: '100%', padding: '14px', marginTop: 8 }}
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload Track'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UploadPage;
