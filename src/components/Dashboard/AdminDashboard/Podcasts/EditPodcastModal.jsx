// EditPodcastModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './Podcasts.module.css';

// List of available categories
const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

// List of supported platforms
const PLATFORMS = [
  { value: 'YOUTUBE', label: 'YouTube', icon: 'fab fa-youtube' },
  { value: 'VIMEO', label: 'Vimeo', icon: 'fab fa-vimeo-v' },
  { value: 'DAILYMOTION', label: 'Dailymotion', icon: 'fas fa-video' },
  { value: 'OTHER', label: 'Other', icon: 'fas fa-link' }
];

const EditPodcastModal = ({ isOpen, onClose, podcast, onPodcastUpdated }) => {
  // Use API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';
  
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

  // Initialize form with podcast data
  useEffect(() => {
    if (podcast && isOpen) {
      // Handle different URL field names (backward compatibility)
      const videoUrl = podcast.videoUrl || podcast.vimeoUrl || '';
      
      setFormData({
        title: podcast.title || '',
        episode: podcast.episode ? podcast.episode.toString() : '',
        season: podcast.season ? podcast.season.toString() : '1',
        videoUrl: videoUrl,
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

      // Set initial preview image
      if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
        setPreviewUrl(podcast.coverImage);
      } else if (podcast.thumbnailUrl) {
        setPreviewUrl(podcast.thumbnailUrl);
      } else {
        const { platform, videoId } = detectVideoSource(videoUrl);
        setDetectedPlatform(platform);
        
        if (platform === 'YOUTUBE' && videoId) {
          setPreviewUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        } else if (platform === 'VIMEO') {
          setPreviewUrl('/images/vimeo-placeholder.jpg');
        } else if (platform === 'DAILYMOTION' && videoId) {
          setPreviewUrl(`https://www.dailymotion.com/thumbnail/video/${videoId}`);
        } else {
          setPreviewUrl('/images/podcast-default.jpg');
        }
      }
    }
  }, [podcast, isOpen]);

  if (!isOpen || !podcast) return null;

  // Fonction pour détecter la plateforme vidéo à partir d'une URL
  const detectVideoSource = (url) => {
    try {
      if (!url) return { platform: '', videoId: null };
      
      const videoUrl = new URL(url);
      const hostname = videoUrl.hostname.toLowerCase();
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId;
        if (hostname.includes('youtu.be')) {
          videoId = videoUrl.pathname.substring(1);
        } else if (videoUrl.pathname.includes('/embed/')) {
          videoId = videoUrl.pathname.split('/embed/')[1];
        } else if (videoUrl.pathname.includes('/shorts/')) {
          videoId = videoUrl.pathname.split('/shorts/')[1];
        } else {
          videoId = videoUrl.searchParams.get('v');
        }
        return { platform: 'YOUTUBE', videoId };
      }
      
      // Vimeo
      else if (hostname.includes('vimeo.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        return { platform: 'VIMEO', videoId: pathParts[0] };
      }
      
      // Dailymotion
      else if (hostname.includes('dailymotion.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        let videoId = pathParts[pathParts.length - 1];
        if (videoId.includes('video/')) {
          videoId = videoId.split('video/')[1];
        }
        return { platform: 'DAILYMOTION', videoId };
      }
      
      // Autre
      return { platform: 'OTHER', videoId: null };
    } catch (error) {
      console.error('Error detecting video platform:', error);
      return { platform: '', videoId: null };
    }
  };

  // Get thumbnail URL from platform and videoId
  const getThumbnailUrl = (platform, videoId) => {
    switch (platform) {
      case 'YOUTUBE':
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      case 'VIMEO':
        return '/images/vimeo-placeholder.jpg';
      case 'DAILYMOTION':
        return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
      default:
        return '/images/podcast-default.jpg';
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If video URL changes, update preview and platform
    if (name === 'videoUrl') {
      const { platform, videoId } = detectVideoSource(value);
      setDetectedPlatform(platform);
      
      if (platform && videoId) {
        // Update platform and videoId in form data
        setFormData(prev => ({
          ...prev,
          platform,
          videoId
        }));
        
        // Update preview image
        const thumbnailUrl = getThumbnailUrl(platform, videoId);
        setPreviewUrl(thumbnailUrl);
      } else {
        setPreviewUrl('/images/podcast-default.jpg');
      }
    }

    // If coverImage provided, use it as preview
    if (name === 'coverImage' && value) {
      setPreviewUrl(value);
    }

    // Clear error when user types
    if (error) setError('');
  };

  // Check if form has changes
  const hasChanges = () => {
    // Get videoUrl from both possible sources for comparison
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

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.episode.trim()) {
      setError('Episode number is required');
      return false;
    }
    if (!formData.videoUrl.trim()) {
      setError('Video URL is required');
      return false;
    }
    if (!formData.duration.trim()) {
      setError('Duration is required');
      return false;
    }
    
    // Check if URL is valid
    try {
      new URL(formData.videoUrl);
    } catch (err) {
      setError('Please enter a valid URL');
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!hasChanges()) {
      setError('No changes detected');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }
      
      // Prepare topics as an array
      const topicsArray = formData.topics
        ? formData.topics.split(',').map(topic => topic.trim())
        : [];
      
      // Create FormData for file upload capability
      const formDataToSend = new FormData();
      
      // Add form fields to FormData
      formDataToSend.append('title', formData.title);
      formDataToSend.append('episode', formData.episode);
      formDataToSend.append('season', formData.season);
      formDataToSend.append('videoUrl', formData.videoUrl);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('coverImage', formData.coverImage);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('guestName', formData.guestName || '');
      formDataToSend.append('hostName', formData.hostName || 'Mike Levis');
      formDataToSend.append('publishDate', formData.publishDate);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('isPublished', formData.isPublished ? 'true' : 'false');
      formDataToSend.append('platform', formData.platform);
      formDataToSend.append('videoId', formData.videoId);
      
      // Add topics as JSON string
      formDataToSend.append('topics', JSON.stringify(topicsArray));
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/${podcast._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to update podcast');
      }
      
      const data = await response.json();
      
      // Notify parent
      onPodcastUpdated(data.data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
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
            <label htmlFor="title">
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter podcast title"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="episode">
                Episode Number <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="episode"
                name="episode"
                value={formData.episode}
                onChange={handleChange}
                placeholder="1"
                min="1"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="season">
                Season
              </label>
              <input
                type="number"
                id="season"
                name="season"
                value={formData.season}
                onChange={handleChange}
                placeholder="1"
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="videoUrl">
              Video URL <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={loading}
              required
            />
            <small className={styles.formHelp}>
              {formData.videoUrl ? (
                detectedPlatform ? (
                  <span className={styles.detectedPlatform}>
                    <i className={PLATFORMS.find(p => p.value === detectedPlatform)?.icon || 'fas fa-link'}></i> {PLATFORMS.find(p => p.value === detectedPlatform)?.label || 'Unknown'} video detected
                  </span>
                ) : (
                  <span className={styles.invalidPlatform}>
                    <i className="fas fa-exclamation-triangle"></i> Invalid video URL
                  </span>
                )
              ) : (
                'Enter YouTube, Vimeo or Dailymotion URL'
              )}
            </small>
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img 
                  src={previewUrl} 
                  alt="Podcast thumbnail" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/podcast-default.jpg';
                  }}
                />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="duration">
                Duration (minutes) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="45"
                min="1"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="guestName">
                Guest Name
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleChange}
                placeholder="Guest name (optional)"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hostName">
                Host Name
              </label>
              <input
                type="text"
                id="hostName"
                name="hostName"
                value={formData.hostName}
                onChange={handleChange}
                placeholder="Mike Levis"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImage">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg (optional)"
              disabled={loading}
            />
            <small className={styles.formHelp}>
              Leave empty to use the video thumbnail automatically
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="publishDate">
              Publish Date
            </label>
            <input
              type="date"
              id="publishDate"
              name="publishDate"
              value={formData.publishDate}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="topics">
              Topics (separated by commas)
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              placeholder="music, history, career"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Podcast description"
              disabled={loading}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isPublished: e.target.checked
                }))}
                disabled={loading}
              />
              Publish
            </label>
          </div>
        </form>
        
        <div className={styles.modalFooter}>
          <button 
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            type="submit"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading || !hasChanges()}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPodcastModal;