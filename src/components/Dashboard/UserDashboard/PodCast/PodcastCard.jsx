import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import styles from './WeeklyPodcast.module.css';

const DEFAULT_IMAGE_PATH = '/images/podcast-default.jpg';

// Helpers URL images
const getApiBaseUrl = () => {
  let api = (process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com').trim();
  if (!/^https?:\/\//i.test(api)) api = `https://${api}`;
  api = api.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  return api;
};
const resolveImageUrl = (path) => {
  if (!path) return DEFAULT_IMAGE_PATH;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/') || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) return `${getApiBaseUrl()}${path}`;
  if (path.startsWith('/')) return `${getApiBaseUrl()}${path}`;
  return `${getApiBaseUrl()}/uploads/podcasts/${path}`;
};

const PodcastCard = ({ podcast, onPlay, isPlaying, getImagePath, handleImageError }) => {
  const [imageError, setImageError] = useState(false);
  const formatEpisodeNumber = (episode) => `EP.${episode.toString().padStart(2, '0')}`;

  const onImageError = (e) => {
    setImageError(true);
    if (handleImageError) handleImageError(e);
    else {
      e.target.onerror = null;
      if (podcast.thumbnailUrl && !e.target.src.includes(podcast.thumbnailUrl)) e.target.src = resolveImageUrl(podcast.thumbnailUrl);
      else e.target.src = DEFAULT_IMAGE_PATH;
    }
  };

  const getImageSrc = () => {
    if (imageError) return DEFAULT_IMAGE_PATH;
    if (getImagePath) return getImagePath(podcast);

    if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
      return resolveImageUrl(podcast.coverImage);
    }
    if (podcast.thumbnailUrl) {
      return resolveImageUrl(podcast.thumbnailUrl);
    }
    if (podcast.platform && podcast.videoId) {
      switch (podcast.platform) {
        case 'YOUTUBE': return `https://img.youtube.com/vi/${podcast.videoId}/mqdefault.jpg`;
        case 'DAILYMOTION': return `https://www.dailymotion.com/thumbnail/video/${podcast.videoId}`;
        default: break; // Vimeo needs API for direct thumbnail
      }
    }
    const idSum = (podcast._id || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return `/images/podcast-${(idSum % 6) + 1}.jpg`;
  };

  const getPlatformBadge = () => {
    switch (podcast.platform) {
      case 'YOUTUBE': return <span className={styles.platformBadge}>YouTube</span>;
      case 'VIMEO': return <span className={styles.platformBadge}>Vimeo</span>;
      case 'DAILYMOTION': return <span className={styles.platformBadge}>Dailymotion</span>;
      default: return null;
    }
  };

  return (
    <div className={styles.podcastCard}>
      <div className={styles.podcastCardImageWrapper}>
        <span className={styles.episodeNumber}>{formatEpisodeNumber(podcast.episode)}</span>
        <div className={styles.playButton} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(); }}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </div>
        <img
          src={getImageSrc()}
          alt={podcast.title}
          className={styles.podcastCardImage}
          onError={onImageError}
          crossOrigin="anonymous"
        />
        {getPlatformBadge()}
      </div>
      <div className={styles.podcastCardContent}>
        <div className={styles.podcastCardMeta}>
          <span className={styles.hostName}>{podcast.hostName}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.category}>{podcast.category}</span>
        </div>
        <h3 className={styles.podcastCardTitle}>
          <Link to={`/dashboard/podcast/${podcast._id}`}>{podcast.title}</Link>
        </h3>
        <p className={styles.podcastCardDescription}>
          {podcast.description && podcast.description.length > 120
            ? `${podcast.description.substring(0, 120)}...`
            : podcast.description || 'Aucune description disponible.'}
        </p>
        <div className={styles.podcastCardActions}>
          <button className={styles.playEpisodeButton} onClick={(e) => { e.preventDefault(); onPlay(); }}>
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} /> {isPlaying ? "Pause" : "Play"}
          </button>
          <span className={styles.episodeDuration}>{podcast.duration} min • S{podcast.season}</span>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;
