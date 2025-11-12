import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faSpinner,
  faHeadphones,
  faArrowLeft,
  faArrowRight,
  faInfoCircle,
  faExclamationTriangle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import styles from './WeeklyPodcast.module.css';
import PodcastCard from './PodcastCard';
import api from '../../../../utils/api';

const DEFAULT_IMAGE_PATH = '/images/podcast-default.jpg';

// Helpers URL images
const getApiBaseUrl = () => {
  let apiBase = (process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com').trim();
  if (!/^https?:\/\//i.test(apiBase)) apiBase = `https://${apiBase}`;
  apiBase = apiBase.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  return apiBase;
};
const resolveImageUrl = (path) => {
  if (!path) return DEFAULT_IMAGE_PATH;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/') || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) return `${getApiBaseUrl()}${path}`;
  if (path.startsWith('/')) return `${getApiBaseUrl()}${path}`;
  return `${getApiBaseUrl()}/uploads/podcasts/${path}`;
};

const WeeklyPodcast = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [featuredPodcast, setFeaturedPodcast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const navigate = useNavigate();

  const formatEpisodeNumber = (episode) => `EP.${episode.toString().padStart(2, '0')}`;

  useEffect(() => {
    const fetchPodcasts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/podcasts/user`, { params: { page: currentPage, limit: 6 } });
        if (response.data.success) {
          setPodcasts(response.data.data || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
          if (response.data.featuredPodcast) setFeaturedPodcast(response.data.featuredPodcast);
          else if (response.data.data?.length) setFeaturedPodcast(response.data.data[0]);
        } else {
          throw new Error(response.data.message || 'Failed to fetch podcasts');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading podcasts');
        if (podcasts.length === 0) setupMockData();
      } finally {
        setIsLoading(false);
      }
    };
    fetchPodcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const setupMockData = () => {
    const mockPodcasts = [
      { _id: '1', title: 'The Evolution of Music Through Decades', episode: 1, season: 1, hostName: 'MIKE LEVIS', guestName: 'Anna Smith', category: 'THROWBACK HISTORY', duration: 60, publishDate: new Date().toISOString(), description: 'Exploring how music has evolved...', vimeoUrl: 'https://vimeo.com/123456789', viewCount: 1542, likeCount: 287 },
      { _id: '2', title: 'Building Your Music Brand From Scratch', episode: 2, season: 1, hostName: 'MIKE LEVIS', guestName: 'John Doe', category: 'PERSONAL BRANDING', duration: 55, publishDate: new Date().toISOString(), description: 'Learn how to build your identity...', vimeoUrl: 'https://vimeo.com/123456790', viewCount: 1245, likeCount: 198 },
      { _id: '3', title: 'The 80s Music Revolution', episode: 3, season: 1, hostName: 'MIKE LEVIS', guestName: 'Sarah Johnson', category: 'THROWBACK HISTORY', duration: 62, publishDate: new Date().toISOString(), description: 'A deep dive into the 80s scene...', vimeoUrl: 'https://vimeo.com/123456791', viewCount: 980, likeCount: 145 },
      { _id: '4', title: 'Finding Your Unique Voice As An Artist', episode: 4, season: 1, hostName: 'MIKE LEVIS', guestName: 'Michael Brown', category: 'ARTIST INTERVIEW', duration: 58, publishDate: new Date().toISOString(), description: 'Discover your unique sound...', vimeoUrl: 'https://vimeo.com/123456792', viewCount: 845, likeCount: 123 },
      { _id: '5', title: 'The Business Side of Music', episode: 5, season: 1, hostName: 'MIKE LEVIS', guestName: 'Emily Williams', category: 'MUSIC BUSINESS', duration: 65, publishDate: new Date().toISOString(), description: 'Contracts, royalties & finances...', vimeoUrl: 'https://vimeo.com/123456793', viewCount: 732, likeCount: 98 },
      { _id: '6', title: 'Digital Music Distribution in 2025', episode: 6, season: 1, hostName: 'MIKE LEVIS', guestName: 'David Wilson', category: 'INDUSTRY INSIGHTS', duration: 60, publishDate: new Date().toISOString(), description: 'How platforms transformed distribution...', vimeoUrl: 'https://vimeo.com/123456794', viewCount: 654, likeCount: 87 }
    ];
    setPodcasts(mockPodcasts);
    setFeaturedPodcast(mockPodcasts[0]);
  };

  const handlePlay = (p) => {
    if (nowPlaying && nowPlaying._id === p._id) setIsPlaying(!isPlaying);
    else {
      setNowPlaying(p); setIsPlaying(true);
      navigate(`/dashboard/podcast/${p._id}`);
    }
  };

  const handleImageError = (e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_PATH; };

  const getImagePath = (p) => resolveImageUrl(p.coverImage || p.thumbnailUrl);

  return (
    <div className={styles.weeklyPodcastContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}><FontAwesomeIcon icon={faHeadphones} className={styles.pageTitleIcon} />Weekly Podcast</h1>
          <p className={styles.pageSubtitle}>Discover our weekly podcasts with industry professionals and artists</p>
        </div>
      </header>

      {featuredPodcast && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Latest Episode</h2>
          <div className={styles.featuredPodcast}>
            <div className={styles.featuredPodcastImage}>
              <span className={styles.episodeNumber}>{formatEpisodeNumber(featuredPodcast.episode)}</span>
              <div className={styles.playButton} onClick={() => handlePlay(featuredPodcast)}>
                <FontAwesomeIcon icon={isPlaying && nowPlaying?._id === featuredPodcast._id ? faPause : faPlay} />
              </div>
              <img
                src={getImagePath(featuredPodcast)}
                alt={featuredPodcast.title}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            </div>
            <div className={styles.featuredPodcastContent}>
              <div className={styles.podcastMeta}>
                <span className={styles.hostName}>{featuredPodcast.hostName}</span>
                <span className={styles.divider}>•</span>
                <span className={styles.category}>{featuredPodcast.category}</span>
              </div>
              <h3 className={styles.podcastTitle}>{featuredPodcast.title}</h3>
              <p className={styles.podcastDescription}>{featuredPodcast.description}</p>
              <div className={styles.podcastStats}>
                <span className={styles.duration}><FontAwesomeIcon icon={faCalendarAlt} />{new Date(featuredPodcast.publishDate).toLocaleDateString()}</span>
                <span className={styles.duration}><FontAwesomeIcon icon={faInfoCircle} />{featuredPodcast.duration} min</span>
                <Link to={`/dashboard/podcast/${featuredPodcast._id}`} className={styles.detailsLink}>
                  <FontAwesomeIcon icon={faInfoCircle} />View Details
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.episodesSection}>
        <h2 className={styles.sectionTitle}>All Episodes</h2>

        {isLoading ? (
          <div className={styles.loadingContainer}><FontAwesomeIcon icon={faSpinner} spin size="2x" /><span>Loading podcasts...</span></div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
            <p>Error: {error}</p>
            <button className={styles.retryButton} onClick={() => setCurrentPage(1)}>Retry</button>
          </div>
        ) : podcasts.length === 0 ? (
          <div className={styles.emptyContainer}><FontAwesomeIcon icon={faInfoCircle} size="2x" /><p>No podcasts found. New episodes coming soon!</p></div>
        ) : (
          <>
            <div className={styles.podcastGrid}>
              {podcasts.map((p) => (
                <PodcastCard
                  key={p._id}
                  podcast={p}
                  onPlay={() => handlePlay(p)}
                  isPlaying={isPlaying && nowPlaying?._id === p._id}
                  getImagePath={getImagePath}
                  handleImageError={handleImageError}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.paginationButton} disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                  <FontAwesomeIcon icon={faArrowLeft} /><span>Previous</span>
                </button>
                <div className={styles.pageInfo}>Page {currentPage} of {totalPages}</div>
                <button className={styles.paginationButton} disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                  <span>Next</span><FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default WeeklyPodcast;
