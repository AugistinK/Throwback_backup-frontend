// file_create: /home/claude/PodcastCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { getPodcastImageUrl, handlePodcastImageError } from '../utils/imageUtils';
import styles from './WeeklyPodcast.module.css';

const PodcastCard = ({ podcast, onPlay, isPlaying }) => {
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

  // Récupérer l'URL de l'image
  const imageUrl = getPodcastImageUrl(podcast);

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
          src={imageUrl}
          alt={podcast.title}
          className={styles.podcastCardImage}
          data-podcast-id={podcast._id}
          onError={handlePodcastImageError}
          crossOrigin="anonymous"
        />
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
          {podcast.description}
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