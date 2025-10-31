// file_create: /home/claude/PodcastDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faSpinner,
  faCalendarAlt,
  faEye,
  faThumbsUp,
  faBookmark,
  faShareAlt,
  faExclamationTriangle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import podcastAPI from '../../../../utils/podcastAPI';
import { getPodcastImageUrl, handlePodcastImageError } from '../utils/imageUtils';
import styles from './PodcastDetail.module.css';
import PlaylistSelectionModal from './PlaylistSelectionModal';

const PodcastDetail = () => {
  const { podcastId } = useParams();
  const navigate = useNavigate();
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  
  // Fetch podcast details
  useEffect(() => {
    const fetchPodcastDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching podcast details:', podcastId);
        const podcastData = await podcastAPI.getPodcastById(podcastId);
        console.log('Podcast details:', podcastData);
        
        if (podcastData) {
          setPodcast(podcastData);
          fetchPodcastMemories(podcastId);
        } else {
          throw new Error('Failed to fetch podcast details');
        }
      } catch (err) {
        console.error('Error fetching podcast details:', err);
        setError(err.message || 'An error occurred while loading podcast');
      } finally {
        setLoading(false);
      }
    };
    
    if (podcastId) {
      fetchPodcastDetails();
    }
  }, [podcastId]);
  
  // Fetch memories
  const fetchPodcastMemories = async (id) => {
    try {
      console.log('Fetching podcast memories:', id);
      const memoriesData = await podcastAPI.getPodcastMemories(id);
      console.log('Podcast memories:', memoriesData);
      setMemories(memoriesData || []);
    } catch (err) {
      console.error('Error fetching memories:', err);
      // Non-critical error, continue with empty memories
      setMemories([]);
    }
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    // In a real implementation, this would trigger audio/video playback
    console.log('Play/pause toggled:', !isPlaying);
  };
  
  // Handle like
  const handleLike = async () => {
    if (!podcast) return;
    
    try {
      const response = await podcastAPI.likePodcast(podcastId);
      console.log('Like response:', response);
      
      if (response && response.success) {
        // Update local state with new like status
        setPodcast({
          ...podcast,
          userInteraction: {
            ...podcast.userInteraction,
            liked: response.data.liked
          },
          likeCount: response.data.likeCount
        });
      }
    } catch (err) {
      console.error('Error liking podcast:', err);
    }
  };
  
  // Handle bookmark
  const handleBookmark = async () => {
    if (!podcast) return;
    
    try {
      const response = await podcastAPI.bookmarkPodcast(podcastId);
      console.log('Bookmark response:', response);
      
      if (response && response.success) {
        // Update local state with new bookmark status
        setPodcast({
          ...podcast,
          userInteraction: {
            ...podcast.userInteraction,
            bookmarked: response.data.bookmarked
          }
        });
      }
    } catch (err) {
      console.error('Error bookmarking podcast:', err);
    }
  };
  
  // Format episode number (EP.01)
  const formatEpisodeNumber = (episode) => {
    if (!episode) return 'EP.01';
    return `EP.${episode.toString().padStart(2, '0')}`;
  };
  
  // Get embed URL
  const getEmbedUrl = (podcast) => {
    if (!podcast) return null;
    
    // Use embedUrl if available from API
    if (podcast.embedUrl) {
      return podcast.embedUrl;
    }
    
    // Otherwise try to construct it
    if (podcast.platform && podcast.videoId) {
      switch (podcast.platform) {
        case 'YOUTUBE':
          return `https://www.youtube.com/embed/${podcast.videoId}`;
        case 'VIMEO':
          return `https://player.vimeo.com/video/${podcast.videoId}`;
        case 'DAILYMOTION':
          return `https://www.dailymotion.com/embed/video/${podcast.videoId}`;
        default:
          return null;
      }
    }
    
    // For older version where only vimeoUrl exists
    if (podcast.vimeoUrl) {
      const vimeoId = podcast.vimeoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    return podcast.videoUrl || null;
  };

  // Get image URL using our utility
  const getImageUrl = (podcast) => {
    return getPodcastImageUrl(podcast);
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Loading podcast...</p>
      </div>
    );
  }
  
  if (error || !podcast) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
        <h2>Error Loading Podcast</h2>
        <p>{error || 'Podcast not found'}</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Go Back
        </button>
      </div>
    );
  }
  
  // Get image URL for this podcast
  const podcastImageUrl = getImageUrl(podcast);
  
  return (
    <div className={styles.podcastDetailContainer}>
      <button 
        className={styles.backButton}
        onClick={() => navigate(-1)}
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
      
      <div className={styles.podcastHeader}>
        <div className={styles.podcastHeaderImage}>
          <img 
            src={podcastImageUrl}
            alt={podcast.title}
            data-podcast-id={podcast._id}
            onError={handlePodcastImageError}
            crossOrigin="anonymous"
          />
        </div>
        
        <div className={styles.podcastHeaderContent}>
          <div className={styles.podcastHeaderTop}>
            <span className={styles.episodeNumber}>
              {formatEpisodeNumber(podcast.episode)}
            </span>
            <span className={styles.seasonNumber}>
              Season {podcast.season || 1}
            </span>
            <span className={styles.categoryBadge}>
              {podcast.category}
            </span>
          </div>
          
          <h1 className={styles.podcastTitle}>{podcast.title}</h1>
          
          <div className={styles.podcastMeta}>
            <span className={styles.hostInfo}>
              {podcast.guestName ? 
                `Host: ${podcast.hostName} • Guest: ${podcast.guestName}` : 
                `Host: ${podcast.hostName}`}
            </span>
            <span className={styles.publishDate}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              {new Date(podcast.publishDate).toLocaleDateString()}
            </span>
            <span className={styles.duration}>
              {podcast.duration} minutes
            </span>
          </div>
          
          <div className={styles.podcastStats}>
            <span className={styles.views}>
              <FontAwesomeIcon icon={faEye} />
              {podcast.viewCount || 0} views
            </span>
            <span className={styles.likes}>
              <FontAwesomeIcon icon={faThumbsUp} />
              {podcast.likeCount || 0} likes
            </span>
          </div>
          
          <div className={styles.podcastActions}>
            <button 
              className={styles.playButton}
              onClick={handlePlayPause}
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button 
              className={`${styles.likeButton} ${podcast.userInteraction?.liked ? styles.liked : ''}`}
              onClick={handleLike}
            >
              <FontAwesomeIcon icon={faThumbsUp} />
              {podcast.userInteraction?.liked ? 'Liked' : 'Like'}
            </button>
            
            <button 
              className={`${styles.bookmarkButton} ${podcast.userInteraction?.bookmarked ? styles.bookmarked : ''}`}
              onClick={handleBookmark}
            >
              <FontAwesomeIcon icon={faBookmark} />
              {podcast.userInteraction?.bookmarked ? 'Saved' : 'Save'}
            </button>
            
            <button 
              className={styles.addToPlaylistButton}
              onClick={() => setIsPlaylistModalOpen(true)}
            >
              <FontAwesomeIcon icon={faShareAlt} />
              Add to Playlist
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.podcastContent}>
        <div className={styles.podcastVideo}>
          {getEmbedUrl(podcast) ? (
            <div className={styles.videoWrapper}>
              <iframe
                src={getEmbedUrl(podcast)}
                title={podcast.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className={styles.noVideoMessage}>
              <p>Video playback is not available for this podcast</p>
              {podcast.videoUrl && (
                <a 
                  href={podcast.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Watch on external platform
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.podcastDescription}>
          <h2>About this episode</h2>
          <p>{podcast.description}</p>
          
          {podcast.topics && podcast.topics.length > 0 && (
            <div className={styles.topicsList}>
              <h3>Topics</h3>
              <div className={styles.topics}>
                {podcast.topics.map((topic, index) => (
                  <span key={index} className={styles.topicTag}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Memories section */}
      <div className={styles.memoriesSection}>
        <h2>Memories</h2>
        
        {memories.length > 0 ? (
          <div className={styles.memoriesList}>
            {memories.map((memory, index) => (
              <div key={memory.id || index} className={styles.memoryCard}>
                <div className={styles.memoryAuthor}>
                  <img 
                    src={memory.imageUrl} 
                    alt={memory.username}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default-avatar.jpg';
                    }}
                  />
                  <div>
                    <h3>{memory.username}</h3>
                    <span>{new Date(memory.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className={styles.memoryContent}>{memory.content}</p>
                <div className={styles.memoryMeta}>
                  <span>{memory.likes} likes</span>
                  <span>{memory.comments} comments</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noMemories}>No memories shared yet. Be the first to share your memory!</p>
        )}
      </div>
      
      {/* Playlist modal */}
      <PlaylistSelectionModal
        podcastId={podcastId}
        onClose={() => setIsPlaylistModalOpen(false)}
        onSuccess={() => {
          setIsPlaylistModalOpen(false);
          // Optionally refresh podcast data
        }}
        isOpen={isPlaylistModalOpen}
      />
    </div>
  );
};

export default PodcastDetail;