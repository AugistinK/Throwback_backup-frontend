import React, { useState, useEffect } from 'react';
import styles from './Podcasts.module.css';
import { getApiEndpoint } from './imageUtils';

// Liste des catégories
const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const AddPodcastModal = ({ isOpen, onClose, onPodcastCreated }) => {
  const API_BASE = getApiEndpoint();

  const [formData, setFormData] = useState({
    title: '',
    episode: '',
    season: '1',
    videoUrl: '',
    duration: '',
    coverImage: null,
    description: '',
    guestName: '',
    hostName: 'Mike Levis',
    publishDate: new Date().toISOString().split('T')[0],
    topics: '',
    category: 'PERSONAL BRANDING',
    isPublished: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedPlatform, setDetectedPlatform] = useState('');
  const [videoIdPreview, setVideoIdPreview] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl('');
      setDetectedPlatform('');
      setVideoIdPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detectVideoSource = (url) => {
    try {
      if (!url) return { platform: '', videoId: null };
      const u = new URL(url);
      const host = u.hostname.toLowerCase();

      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        let videoId;
        if (host.includes('youtu.be')) videoId = u.pathname.substring(1);
        else if (u.pathname.includes('/embed/')) videoId = u.pathname.split('/embed/')[1];
        else if (u.pathname.includes('/shorts/')) videoId = u.pathname.split('/shorts/')[1];
        else videoId = u.searchParams.get('v');
        return { platform: 'YouTube', videoId };
      }
      if (host.includes('vimeo.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        return { platform: 'Vimeo', videoId: parts[0] };
      }
      if (host.includes('dailymotion.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        let videoId = parts[parts.length - 1];
        if (videoId.includes('video/')) videoId = videoId.split('video/')[1];
        return { platform: 'Dailymotion', videoId };
      }
      return { platform: 'Autre', videoId: null };
    } catch {
      return { platform: '', videoId: null };
    }
  };

  const getVideoThumbnailUrl = (platform, videoId) => {
    switch (platform) {
      case 'YouTube':
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      case 'Vimeo':
        return '/images/vimeo-placeholder.jpg';
      case 'Dailymotion':
        return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
      default:
        return '/images/podcast-default.jpg';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'videoUrl') {
      const { platform, videoId } = detectVideoSource(value);
      setDetectedPlatform(platform);
      setVideoIdPreview(videoId);
      setPreviewUrl(videoId ? getVideoThumbnailUrl(platform, videoId) : '');
    }
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return setError('Title is required'), false;
    if (!formData.episode.trim()) return setError('Episode number is required'), false;
    if (!formData.videoUrl.trim()) return setError('Video URL is required'), false;
    if (!formData.duration.trim()) return setError('Duration is required'), false;
    const { platform } = detectVideoSource(formData.videoUrl);
    if (!platform) return setError('Please enter a valid video URL'), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');

      const topicsArray = formData.topics ? formData.topics.split(',').map(t => t.trim()) : [];

      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('episode', formData.episode);
      fd.append('season', formData.season);
      fd.append('videoUrl', formData.videoUrl);
      fd.append('duration', formData.duration);
      fd.append('description', formData.description || '');
      fd.append('guestName', formData.guestName || '');
      fd.append('hostName', formData.hostName || 'Mike Levis');
      fd.append('publishDate', formData.publishDate);
      fd.append('category', formData.category);
      fd.append('isPublished', formData.isPublished);
      fd.append('topics', JSON.stringify(topicsArray));
      if (selectedFile) fd.append('coverImage', selectedFile);

      const res = await fetch(`${API_BASE}/podcasts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(err.message || 'Failed to create podcast');
      }

      const data = await res.json();

      // reset
      setFormData({
        title: '',
        episode: '',
        season: '1',
        videoUrl: '',
        duration: '',
        coverImage: null,
        description: '',
        guestName: '',
        hostName: 'Mike Levis',
        publishDate: new Date().toISOString().split('T')[0],
        topics: '',
        category: 'PERSONAL BRANDING',
        isPublished: true
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setDetectedPlatform('');
      setVideoIdPreview(null);

      onPodcastCreated(data.data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData({
      title: '',
      episode: '',
      season: '1',
      videoUrl: '',
      duration: '',
      coverImage: null,
      description: '',
      guestName: '',
      hostName: 'Mike Levis',
      publishDate: new Date().toISOString().split('T')[0],
      topics: '',
      category: 'PERSONAL BRANDING',
      isPublished: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setDetectedPlatform('');
    setVideoIdPreview(null);
    setError('');
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add a New Podcast</h2>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="title">Title <span className={styles.required}>*</span></label>
            <input type="text" id="title" name="title" value={formData.title}
              onChange={handleChange} placeholder="Enter podcast title" disabled={loading} required />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="episode">Episode Number <span className={styles.required}>*</span></label>
              <input type="number" id="episode" name="episode" value={formData.episode}
                onChange={handleChange} placeholder="1" min="1" disabled={loading} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="season">Season</label>
              <input type="number" id="season" name="season" value={formData.season}
                onChange={handleChange} placeholder="1" min="1" disabled={loading} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="videoUrl">Video URL <span className={styles.required}>*</span></label>
            <input type="url" id="videoUrl" name="videoUrl" value={formData.videoUrl}
              onChange={handleChange} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={loading} required />
            <small className={styles.formHelp}>
              {formData.videoUrl ? (
                detectedPlatform ? (
                  <span className={styles.detectedPlatform}>
                    <i className="fas fa-check-circle"></i> {detectedPlatform} video detected
                  </span>
                ) : (
                  <span className={styles.invalidPlatform}>
                    <i className="fas fa-exclamation-triangle"></i> Invalid video URL
                  </span>
                )
              ) : ('Enter YouTube, Vimeo or Dailymotion URL')}
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImage">Cover Image (Optional)</label>
            <div className={styles.fileUploadContainer}>
              <input type="file" id="coverImage" name="coverImage" onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif" disabled={loading} className={styles.fileInput}/>
              <label htmlFor="coverImage" className={styles.fileUploadButton}>
                <i className="fas fa-upload"></i> {selectedFile ? 'Change Image' : 'Select Image'}
              </label>
              <span className={styles.fileName}>
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
            </div>
            <small className={styles.formHelp}>
              {!selectedFile && videoIdPreview ? 'Video thumbnail will be used if no image is uploaded' : 'Max size: 5MB. Recommended: 1280x720px'}
            </small>
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Podcast thumbnail" />
                {!selectedFile && videoIdPreview && (
                  <div className={styles.autoThumbnailBadge}>
                    <i className="fas fa-sync-alt"></i> Auto thumbnail
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category}
                onChange={handleChange} disabled={loading}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="duration">Duration (minutes) <span className={styles.required}>*</span></label>
              <input type="number" id="duration" name="duration" value={formData.duration}
                onChange={handleChange} placeholder="45" min="1" disabled={loading} required />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="guestName">Guest Name</label>
              <input type="text" id="guestName" name="guestName" value={formData.guestName}
                onChange={handleChange} placeholder="Guest name (optional)" disabled={loading} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hostName">Host Name</label>
              <input type="text" id="hostName" name="hostName" value={formData.hostName}
                onChange={handleChange} placeholder="Mike Levis" disabled={loading} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="publishDate">Publish Date</label>
            <input type="date" id="publishDate" name="publishDate" value={formData.publishDate}
              onChange={handleChange} disabled={loading} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="topics">Topics (separated by commas)</label>
            <input type="text" id="topics" name="topics" value={formData.topics}
              onChange={handleChange} placeholder="music, history, career" disabled={loading} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="isPublished" checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                disabled={loading} />
              Publish immediately
            </label>
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={loading}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button type="submit" className={styles.submitButton} onClick={handleSubmit} disabled={loading}>
            {loading ? (<><i className="fas fa-spinner fa-spin"></i> Creating...</>) : (<><i className="fas fa-plus"></i> Add Podcast</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPodcastModal;
