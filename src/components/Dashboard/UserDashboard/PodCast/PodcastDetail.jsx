// PodcastDetail.jsx (user)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faPlay, faPause, faVolumeUp, faVolumeMute, faArrowLeft, faSpinner,
  faCalendarAlt, faUser, faTag, faEye, faHeart, faBookmark, faShare,
  faDownload, faInfoCircle, faExclamationTriangle, faCopy, faList
} from '@fortawesome/free-solid-svg-icons';
import styles from './PodcastDetail.module.css';
import VideoPlayer from './VideoPlayer';
import PlaylistSelectionModal from './PlaylistSelectionModal';
import MemoryList from './MemoryList';
import podcastAPI from '../../../../utils/podcastAPI';

// Helpers URL images
const getApiBaseUrl = () => {
  let api = (process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com').trim();
  if (!/^https?:\/\//i.test(api)) api = `https://${api}`;
  api = api.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  return api;
};
const resolveImageUrl = (path) => {
  if (!path) return '/images/podcast-default.jpg';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/') || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) return `${getApiBaseUrl()}${path}`;
  if (path.startsWith('/')) return `${getApiBaseUrl()}${path}`;
  return `${getApiBaseUrl()}/uploads/podcasts/${path}`;
};

const PodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [podcast, setPodcast] = useState(null);
  const [allPodcasts, setAllPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  
  const [userLiked, setUserLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  
  const [podcastsLoading, setPodcastsLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [playerKey, setPlayerKey] = useState(Date.now());

  const formatEpisodeNumber = (episode) => `EP.${(episode ?? 1).toString().padStart(2, '0')}`;
  const formatTime = (t) => `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;

  useEffect(() => { fetchAllPodcasts(); }, []);
  useEffect(() => {
    if (id) { fetchPodcastById(id); window.scrollTo(0,0); setPlayerKey(Date.now()); }
  }, [id]);

  useEffect(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, []);

  const fetchAllPodcasts = async () => {
    try {
      setPodcastsLoading(true);
      const podcastsData = await podcastAPI.getAllPodcasts({ limit: '50' });
      if (Array.isArray(podcastsData) && podcastsData.length > 0) setAllPodcasts(podcastsData);
    } catch {
      // keep empty silently
    } finally {
      setPodcastsLoading(false);
    }
  };

  const fetchPodcastById = async (podcastId) => {
    try {
      setLoading(true); setError(null);
      const podcastData = await podcastAPI.getPodcastById(podcastId);
      if (podcastData) {
        setPodcast(podcastData);
        setUserLiked(podcastData.userInteraction?.liked || false);
        setIsBookmarked(podcastData.userInteraction?.bookmarked || false);
        setViewCount(podcastData.viewCount || 0);
        setLikeCount(podcastData.likeCount || 0);
      } else setError('Unable to load podcast details');
    } catch {
      setError('Error loading podcast');
    } finally { setLoading(false); }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };
  const handleSeek = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration; setCurrentTime(pos * duration);
  };
  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v); if (audioRef.current) audioRef.current.volume = v;
    setIsMuted(v === 0);
  };
  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) { audioRef.current.volume = prevVolume; setVolume(prevVolume); }
    else { setPrevVolume(volume); audioRef.current.volume = 0; setVolume(0); }
    setIsMuted(!isMuted);
  };

  const handleLikePodcast = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      const optimisticLiked = !userLiked;
      setUserLiked(optimisticLiked); setLikeCount(c => optimisticLiked ? c+1 : Math.max(0,c-1));
      const res = await podcastAPI.likePodcast(id);
      if (res.success && res.data) { setUserLiked(res.data.liked); setLikeCount(res.data.likeCount); }
    } catch {
      setUserLiked(v => !v); // revert
    } finally { setIsLiking(false); }
  };

  const handleBookmarkPodcast = async () => {
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      const optimistic = !isBookmarked; setIsBookmarked(optimistic);
      const res = await podcastAPI.bookmarkPodcast(id);
      if (res.success && res.data) setIsBookmarked(res.data.bookmarked);
    } catch {
      setIsBookmarked(v => !v);
    } finally { setIsBookmarking(false); }
  };

  const handleSharePodcast = () => setShowShareOptions(!showShareOptions);
  const handleShareOption = async (option) => {
    const url = window.location.href; const title = podcast ? podcast.title : 'ThrowBack podcast';
    try {
      switch (option) {
        case 'copy': await navigator.clipboard.writeText(url); setShareMessage('URL copied to clipboard!'); setTimeout(()=>setShareMessage(''),3000); break;
        case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,'_blank'); break;
        case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this awesome podcast: ${title}`)}&url=${encodeURIComponent(url)}`,'_blank'); break;
        case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this awesome podcast: ${title} ${url}`)}`,'_blank'); break;
        default: return;
      }
      podcastAPI.sharePodcast(id, option).catch(()=>{});
    } catch {
      setShareMessage('Error during sharing.'); setTimeout(()=>setShareMessage(''),3000);
    }
    setShowShareOptions(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  const getCoverSrc = () => resolveImageUrl(podcast?.coverImage || podcast?.thumbnailUrl);

  const RecommendedPodcast = ({ podcast: p }) => {
    const isCurrent = podcast && p._id === podcast._id;
    const handleClick = (e) => { e.preventDefault(); navigate(`/dashboard/podcast/${p._id}`); };
    const getThumb = () => resolveImageUrl(p.coverImage || p.thumbnailUrl);
    return (
      <a href={`/dashboard/podcast/${p._id}`} className={`${styles.recommendedPodcast} ${isCurrent ? styles.currentPodcast : ''}`} onClick={handleClick}>
        <div className={styles.recommendedPodcastImage}>
          <span className={styles.recommendedEpisodeNumber}>{formatEpisodeNumber(p.episode)}</span>
          <img
            src={getThumb()}
            alt={p.title}
            className={styles.recommendedImg}
            onError={(e) => { e.target.onerror = null; e.target.src = '/images/podcast-default.jpg'; }}
            crossOrigin="anonymous"
          />
        </div>
        <div className={styles.recommendedInfo}>
          <div className={styles.recommendedHost}>{p.hostName}</div>
          <div className={styles.recommendedTitle}>: {p.title}</div>
        </div>
        {isCurrent && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
      </a>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
        <p>Loading podcast...</p>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <p>{error || 'Podcast not found'}</p>
        <Link to="/dashboard/podcast" className={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to podcasts
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.throwbackPodcastBg}>
      {showPlaylistModal && (
        <PlaylistSelectionModal 
          podcastId={id} 
          onClose={() => setShowPlaylistModal(false)}
          onSuccess={() => { setShowPlaylistModal(false); fetchPodcastById(id); }}
        />
      )}
      
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <div className={styles.backLink}>
            <button className={styles.backButton} onClick={() => navigate('/dashboard/podcast')}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to
            </button>
          </div>

          <div className={styles.podcastPlayerContainer}>
            <div className={styles.podcastHeader}>
              <div className={styles.podcastCover}>
                <span className={styles.episodeNumber}>{formatEpisodeNumber(podcast.episode)}</span>
                <img
                  src={getCoverSrc()}
                  alt={podcast.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/podcast-default.jpg'; }}
                  crossOrigin="anonymous"
                />
                <div className={styles.playButton} onClick={togglePlay}>
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </div>
              </div>
              
              <div className={styles.podcastInfo}>
                <div className={styles.podcastMeta}>
                  <span className={styles.season}>Season {podcast.season}</span>
                  <span className={styles.hostName}>{podcast.hostName}</span>
                  <span className={styles.category}>{podcast.category}</span>
                </div>
                <h1 className={styles.podcastTitle}>{podcast.title}</h1>
                {podcast.guestName && (<div className={styles.guestInfo}><FontAwesomeIcon icon={faUser} /> Guest: {podcast.guestName}</div>)}
                <div className={styles.podcastStats}>
                  <div className={styles.statItem}><FontAwesomeIcon icon={faCalendarAlt} /><span>{formatDate(podcast.publishDate)}</span></div>
                  <div className={styles.statItem}><FontAwesomeIcon icon={faEye} /><span>{viewCount} views</span></div>
                  <div className={`${styles.statItem} ${userLiked ? styles.liked : ''} ${isLiking ? styles.loading : ''}`} onClick={handleLikePodcast}>
                    <FontAwesomeIcon icon={isLiking ? faSpinner : faHeart} spin={isLiking} /><span>{likeCount} likes</span>
                  </div>
                </div>
                <div className={styles.podcastDescription}>{podcast.description}</div>
              </div>
            </div>
          </div>
          
          <div className={styles.podcastActionBar}>
            <div className={styles.actionButtons}>
              <button className={`${styles.actionButton} ${isBookmarked ? styles.activeButton : ''} ${isBookmarking ? styles.loading : ''}`} onClick={handleBookmarkPodcast}>
                <FontAwesomeIcon icon={isBookmarking ? faSpinner : faBookmark} spin={isBookmarking} /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button className={styles.actionButton} onClick={handleSharePodcast}><FontAwesomeIcon icon={faShare} /> Share</button>
              <button className={styles.actionButton} onClick={() => setShowPlaylistModal(true)}><FontAwesomeIcon icon={faList} /> Add to Playlist</button>
            </div>
            {showShareOptions && (
              <div className={styles.shareOptions}>
                <div className={styles.shareOption} onClick={() => handleShareOption('copy')}><FontAwesomeIcon icon={faCopy} /> Copy Link</div>
                <div className={styles.shareOption} onClick={() => handleShareOption('facebook')}><FontAwesomeIcon icon={faFacebook} /> Facebook</div>
                <div className={styles.shareOption} onClick={() => handleShareOption('twitter')}><FontAwesomeIcon icon={faTwitter} /> Twitter</div>
                <div className={styles.shareOption} onClick={() => handleShareOption('whatsapp')}><FontAwesomeIcon icon={faWhatsapp} /> WhatsApp</div>
              </div>
            )}
            {shareMessage && <div className={styles.shareMessage}>{shareMessage}</div>}
          </div>
          
          <div className={styles.memoriesContainer}><MemoryList podcastId={id} /></div>
          
          <div className={styles.podcastVideoSection}>
            <h3 className={styles.sectionTitle}>Podcast Video Preview</h3>
            <div className={styles.embedContainer}><VideoPlayer key={playerKey} podcast={podcast} /></div>
          </div>
          
          {podcast.topics && podcast.topics.length > 0 && (
            <div className={styles.topicsSection}>
              <h3 className={styles.sectionTitle}>Topics Discussed</h3>
              <div className={styles.topicTags}>
                {podcast.topics.map((topic, index) => (
                  <span key={index} className={styles.topicTag}><FontAwesomeIcon icon={faTag} />{topic}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.recommendedPodcastsSection}>
            <h3 className={styles.recommendedSectionTitle}>All Episodes</h3>
            <div className={styles.recommendedPodcastsGrid}>
              {podcastsLoading ? (
                <div className={styles.recommendedLoading}><FontAwesomeIcon icon={faSpinner} spin /><span>Loading podcasts...</span></div>
              ) : allPodcasts.length > 0 ? (
                allPodcasts.map(podcastItem => (<RecommendedPodcast key={podcastItem._id} podcast={podcastItem} />))
              ) : (
                <div className={styles.emptyRecommendations}><p>We're adding new podcasts soon!</p></div>
              )}
            </div>
          </div>
        </main>

        <aside className={styles.rightCards}>
          <h3 className={styles.memoriesSectionTitle}>Featured Podcasts</h3>
          {allPodcasts.length > 0 && (
            <div className={styles.featuredPodcasts}>
              {allPodcasts.slice(0, 3).map(podcastItem => (<RecommendedPodcast key={podcastItem._id} podcast={podcastItem} />))}
            </div>
          )}
        </aside>
      </div>
      
      <audio ref={audioRef} src={podcast.audioUrl || '/audio/sample-podcast.mp3'} preload="metadata" />
    </div>
  );
};

export default PodcastDetail;
