import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause,
  faCalendarAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import styles from './WeeklyPodcast.module.css';

const DEFAULT_IMAGE_PATH = '/images/podcast-default.jpg';

const PodcastCard = ({ podcast, onPlay, isPlaying, getImagePath, handleImageError }) => {
  const [imageError, setImageError] = useState(false);
  
  // Format episode number (e.g., EP.01)
  const formatEpisodeNumber = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle image errors with fallback
  const onImageError = (e) => {
    // Marquer que nous avons eu une erreur d'image
    setImageError(true);
    
    // Appeler le gestionnaire d'erreur externe si fourni
    if (handleImageError) {
      handleImageError(e);
    } else {
      e.target.onerror = null;
      
      // Essayer d'abord le thumbnailUrl s'il existe
      if (podcast.thumbnailUrl && !e.target.src.includes(podcast.thumbnailUrl)) {
        e.target.src = podcast.thumbnailUrl;
      } 
      // Sinon, utiliser l'image par défaut
      else {
        e.target.src = DEFAULT_IMAGE_PATH;
      }
    }
  };

  // Get secure image path - amélioration de l'algorithme pour gérer les erreurs
  const getImageSrc = () => {
    // Si une erreur d'image s'est déjà produite, utiliser l'image par défaut
    if (imageError) {
      return DEFAULT_IMAGE_PATH;
    }
    
    // Si une fonction getImagePath est fournie, l'utiliser
    if (getImagePath) {
      return getImagePath(podcast);
    }
    
    // Sinon, utiliser la logique suivante pour trouver la meilleure image
    
    // 1. Essayer d'abord coverImage si disponible et pas l'image par défaut
    if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
      return podcast.coverImage;
    }
    
    // 2. Essayer thumbnailUrl si disponible
    if (podcast.thumbnailUrl) {
      return podcast.thumbnailUrl;
    }
    
    // 3. Générer une URL de miniature basée sur la plateforme et l'ID
    if (podcast.platform && podcast.videoId) {
      switch (podcast.platform) {
        case 'YOUTUBE':
          return `https://img.youtube.com/vi/${podcast.videoId}/mqdefault.jpg`;
        case 'VIMEO':
          // Impossible de générer directement une URL Vimeo sans API
          break;
        case 'DAILYMOTION':
          return `https://www.dailymotion.com/thumbnail/video/${podcast.videoId}`;
        default:
          break;
      }
    }
    
    // 4. Fallback: créer une image basée sur l'ID
    const idSum = podcast._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `/images/podcast-${(idSum % 6) + 1}.jpg`;
  };

  // Obtenir l'icône de plateforme appropriée
  const getPlatformIcon = () => {
    if (!podcast.platform) return null;
    
    switch (podcast.platform) {
      case 'YOUTUBE':
        return <span className={styles.platformBadge}>YouTube</span>;
      case 'VIMEO':
        return <span className={styles.platformBadge}>Vimeo</span>;
      case 'DAILYMOTION':
        return <span className={styles.platformBadge}>Dailymotion</span>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.podcastCard}>
      <div className={styles.podcastCardImageWrapper}>
        <span className={styles.episodeNumber}>
          {formatEpisodeNumber(podcast.episode)}
        </span>
        <div className={styles.playButton} onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay();
        }}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </div>
        <img
          src={getImageSrc()}
          alt={podcast.title}
          className={styles.podcastCardImage}
          onError={onImageError}
          crossOrigin="anonymous"
        />
        {getPlatformIcon()}
      </div>
      
      <div className={styles.podcastCardContent}>
        <div className={styles.podcastCardMeta}>
          <span className={styles.hostName}>{podcast.hostName}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.category}>{podcast.category}</span>
        </div>
        
        <h3 className={styles.podcastCardTitle}>
          <Link to={`/dashboard/podcast/${podcast._id}`}>
            {podcast.title}
          </Link>
        </h3>
        
        <p className={styles.podcastCardDescription}>
          {podcast.description && podcast.description.length > 120
            ? `${podcast.description.substring(0, 120)}...`
            : podcast.description || 'Aucune description disponible.'
          }
        </p>
        
        <div className={styles.podcastCardActions}>
          <button 
            className={styles.playEpisodeButton}
            onClick={(e) => {
              e.preventDefault();
              onPlay();
            }}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} /> 
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className={styles.episodeDuration}>
            {podcast.duration} min • S{podcast.season}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;