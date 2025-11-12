import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import podcastAPI from '../../../../utils/podcastAPI';
import styles from './MemoryList.module.css';

// Helpers URL images
const getApiBaseUrl = () => {
  let api = (process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com').trim();
  if (!/^https?:\/\//i.test(api)) api = `https://${api}`;
  api = api.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  return api;
};
const resolveImageUrl = (path) => {
  if (!path) return '/images/default-avatar.jpg';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/') || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) return `${getApiBaseUrl()}${path}`;
  if (path.startsWith('/')) return `${getApiBaseUrl()}${path}`;
  return `${getApiBaseUrl()}/uploads/${path}`;
};

const MemoryList = ({ podcastId }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memoryText, setMemoryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await podcastAPI.getPodcastMemories(podcastId);
        setMemories(data || []);
      } catch (err) {
        setError('Error loading memories');
      } finally {
        setLoading(false);
      }
    };
    if (podcastId) fetchMemories();
  }, [podcastId]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { alert('Please log in to share a memory'); return; }
    if (!memoryText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await podcastAPI.addMemory(podcastId, memoryText);
      if (response && response.success) {
        setMemories(prev => [response.data, ...prev]);
        setMemoryText('');
      } else {
        setError(response?.message || 'Error adding memory');
      }
    } catch (err) {
      setError('Error adding memory');
      if (err.response?.status === 401) {
        alert('Please log in to share a memory');
        setIsAuthenticated(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const MemoryCard = ({ memory }) => (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <div className={styles.userInfo}>
          <img 
            src={resolveImageUrl(memory.imageUrl)}
            alt={memory.username}
            className={styles.userAvatar}
            onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-avatar.jpg'; }}
            crossOrigin="anonymous"
          />
          <span className={styles.username}>{memory.username}</span>
        </div>
        <span className={styles.memoryType}>
          {memory.type === 'posted' ? 'shared a memory' : 'shared this podcast'}
        </span>
      </div>
      
      <div className={styles.memoryContent}>
        <div className={styles.podcastInfo}>
          <span className={styles.podcastArtist}>{memory.videoArtist}</span>
          <span className={styles.podcastTitle}> - {memory.videoTitle}</span>
          <span className={styles.podcastYear}> ({memory.videoYear})</span>
        </div>
        <p className={styles.memoryText}>{memory.content}</p>
      </div>
      
      <div className={styles.memoryFooter}>
        <div className={styles.memoryActions}>
          <button className={styles.likeButton}>
            <FontAwesomeIcon icon={faHeart} /> <span>{memory.likes}</span>
          </button>
          <button className={styles.commentButton}>
            <FontAwesomeIcon icon={faComment} /> <span>{memory.comments}</span>
          </button>
        </div>
        <div className={styles.memoryDate}>{formatDate(memory.date)}</div>
      </div>
    </div>
  );

  return (
    <div className={styles.memoryListContainer}>
      <h3 className={styles.sectionTitle}>Shared Memories</h3>
      
      <div className={styles.memoryInputContainer}>
        <form onSubmit={handleAddMemory}>
          <input
            type="text"
            placeholder={isAuthenticated ? "Share a memory related to this podcast..." : "Log in to share a memory"}
            className={styles.memoryInput}
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            disabled={isSubmitting || !isAuthenticated}
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={!memoryText.trim() || isSubmitting || !isAuthenticated}
          >
            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Share'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}
      
      <div className={styles.memoriesList}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
            <p>Loading memories...</p>
          </div>
        ) : memories.length > 0 ? (
          memories.map((memory, index) => (
            <MemoryCard key={memory.id || memory._id || index} memory={memory} />
          ))
        ) : (
          <div className={styles.emptyMessage}>
            <p>No memories shared for this podcast yet.</p>
            <p>Be the first to share a memory!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryList;
