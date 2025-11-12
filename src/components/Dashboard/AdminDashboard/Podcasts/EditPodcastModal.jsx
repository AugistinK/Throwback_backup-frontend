// EditPodcastModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './Podcasts.module.css';
import { getApiEndpoint } from './imageUtils';

const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const PLATFORMS = [
  { value: 'YOUTUBE', label: 'YouTube', icon: 'fab fa-youtube' },
  { value: 'VIMEO', label: 'Vimeo', icon: 'fab fa-vimeo-v' },
  { value: 'DAILYMOTION', label: 'Dailymotion', icon: 'fas fa-video' },
  { value: 'OTHER', label: 'Other', icon: 'fas fa-link' }
];

const EditPodcastModal = ({ isOpen, onClose, podcast, onPodcastUpdated }) => {
  const API_BASE = getApiEndpoint();

  const [formData, setFormData] = useState({
    title: '',
    episode: '',
    season: '',
    videoUrl: '',
    platform: '',
    videoId: '',
    duration: '',
    coverImage: '',
    thumbnailUrl: '',
    description: '',
    guestName: '',
    hostName: '',
    publishDate: '',
    topics: '',
    category: '',
    isPublished: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState('');

  useEffect(() => {
    if (podcast && isOpen) {
      const videoUrl = podcast.videoUrl || podcast.vimeoUrl || '';

      setFormData({
        title: podcast.title || '',
        episode: podcast.episode ? podcast.episode.toString() : '',
        season: podcast.season ? podcast.season.toString() : '1',
        videoUrl,
        platform: podcast.platform || 'VIMEO',
        videoId: podcast.videoId || '',
        duration: podcast.duration ? podcast.duration.toString() : '',
        coverImage: podcast.coverImage || '',
        thumbnailUrl: podcast.thumbnailUrl || '',
        description: podcast.description || '',
        guestName: podcast.guestName || '',
        hostName: podcast.hostName || 'Mike Levis',
        publishDate: podcast.publishDate ? new Date(podcast.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        topics: podcast.topics ? podcast.topics.join(', ') : '',
        category: podcast.category || 'PERSONAL BRANDING',
        isPublished: podcast.isPublished !== undefined ? podcast.isPublished : true
      });

      if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
        setPreviewUrl(podcast.coverImage);
      } else if (podcast.thumbnailUrl) {
        setPreviewUrl(podcast.thumbnailUrl);
      } else {
        const { platform, videoId } = detectVideoSource(videoUrl);
        setDetectedPlatform(platform);
        setPreviewUrl(getThumbnailUrl(platform, videoId));
      }
    }
  }, [podcast, isOpen]);

  if (!isOpen || !podcast) return null;

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
        return { platform: 'YOUTUBE', videoId };
      }
      if (host.includes('vimeo.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        return { platform: 'VIMEO', videoId: parts[0] };
      }
      if (host.includes('dailymotion.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        let videoId = parts[parts.length - 1];
        if (videoId.includes('video/')) videoId = videoId.split('video/')[1];
        return { platform: 'DAILYMOTION', videoId };
      }
      return { platform: 'OTHER', videoId: null };
    } catch {
      return { platform: '', videoId: null };
    }
  };

  const getThumbnailUrl = (platform, videoId) => {
    if (platform === 'YOUTUBE' && videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    if (platform === 'VIMEO') return '/images/vimeo-placeholder.jpg';
    if (platform === 'DAILYMOTION' && videoId) return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
    return '/images/podcast-default.jpg';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'videoUrl') {
      const { platform, videoId } = detectVideoSource(value);
      setDetectedPlatform(platform);
      if (platform && videoId) {
        setFormData(prev => ({ ...prev, platform, videoId }));
        setPreviewUrl(getThumbnailUrl(platform, videoId));
      } else {
        setPreviewUrl('/images/podcast-default.jpg');
      }
    }

    if (name === 'coverImage' && value) setPreviewUrl(value);
    if (error) setError('');
  };

  const hasChanges = () => {
    const originalVideoUrl = podcast.videoUrl || podcast.vimeoUrl || '';
    return (
      formData.title !== (podcast.title || '') ||
      formData.episode !== (podcast.episode ? podcast.episode.toString() : '') ||
      formData.season !== (podcast.season ? podcast.season.toString() : '1') ||
      formData.videoUrl !== originalVideoUrl ||
      formData.duration !== (podcast.duration ? podcast.duration.toString() : '') ||
      formData.coverImage !== (podcast.coverImage || '') ||
      formData.description !== (podcast.description || '') ||
      formData.guestName !== (podcast.guestName || '') ||
      formData.hostName !== (podcast.hostName || 'Mike Levis') ||
      formData.publishDate !== (podcast.publishDate ? new Date(podcast.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) ||
      formData.topics !== (podcast.topics ? podcast.topics.join(', ') : '') ||
      formData.category !== (podcast.category || 'PERSONAL BRANDING') ||
      formData.isPublished !== (podcast.isPublished !== undefined ? podcast.isPublished : true)
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) return setError('Title is required'), false;
    if (!formData.episode.trim()) return setError('Episode number is required'), false;
    if (!formData.videoUrl.trim()) return setError('Video URL is required'), false;
    if (!formData.duration.trim()) return setError('Duration is required'), false;
    try { new URL(formData.videoUrl); } catch { return setError('Please enter a valid URL'), false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!hasChanges()) return setError('No changes detected');

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
      fd.append('coverImage', formData.coverImage);
      fd.append('description', formData.description || '');
      fd.append('guestName', formData.guestName || '');
      fd.append('hostName', formData.hostName || 'Mike Levis');
      fd.append('publishDate', formData.publishDate);
      fd.append('category', formData.category);
      fd.append('isPublished', formData.isPublished ? 'true' : 'false');
      fd.append('platform', formData.platform);
      fd.append('videoId', formData.videoId);
      fd.append('topics', JSON.stringify(topicsArray));

      const res = await fetch(`${API_BASE}/podcasts/${podcast._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(err.message || 'Failed to update podcast');
      }

      const data = await res.json();
      onPodcastUpdated(data.data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Edit Podcast</h2>
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
                    <i className={PLATFORMS.find(p => p.value === detectedPlatform)?.icon || 'fas fa-link'}></i>{' '}
                    {PLATFORMS.find(p => p.value === detectedPlatform)?.label || 'Unknown'} video detected
                  </span>
                ) : (
                  <span className={styles.invalidPlatform}>
                    <i className="fas fa-exclamation-triangle"></i> Invalid video URL
                  </span>
                )
              ) : ('Enter YouTube, Vimeo or Dailymotion URL')}
            </small>
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img
                  src={previewUrl}
                  alt="Podcast thumbnail"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/podcast-default.jpg'; }}
                />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category}
                onChange={handleChange} disabled={loading}>
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
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
            <label htmlFor="coverImage">Cover Image URL</label>
            <input type="url" id="coverImage" name="coverImage" value={formData.coverImage}
              onChange={handleChange} placeholder="https://example.com/image.jpg (optional)" disabled={loading} />
            <small className={styles.formHelp}>Leave empty to use the video thumbnail automatically</small>
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
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description}
              onChange={handleChange} placeholder="Podcast description" disabled={loading} rows={4} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="isPublished" checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                disabled={loading} />
              Publish
            </label>
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={loading}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button type="submit" className={styles.submitButton} onClick={handleSubmit} disabled={loading || !hasChanges()}>
            {loading ? (<><i className="fas fa-spinner fa-spin"></i> Updating...</>) : (<><i className="fas fa-save"></i> Update</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPodcastModal;
