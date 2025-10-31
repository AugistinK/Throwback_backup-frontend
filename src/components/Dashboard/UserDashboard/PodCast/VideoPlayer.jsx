// file_create: /home/claude/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faExpand, faCompress, faExternalLinkAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ podcast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Fonction pour obtenir l'URL d'embed en fonction de la plateforme
  const getVideoEmbedUrl = () => {
    if (!podcast) return null;

    // Vérifier d'abord si nous avons un videoId et une plateforme déjà identifiés
    if (podcast.videoId && podcast.platform) {
      switch (podcast.platform) {
        case 'YOUTUBE':
          return `https://www.youtube.com/embed/${podcast.videoId}?autoplay=0&rel=0`;
        case 'VIMEO':
          return `https://player.vimeo.com/video/${podcast.videoId}`;
        case 'DAILYMOTION':
          return `https://www.dailymotion.com/embed/video/${podcast.videoId}`;
        default:
          break;
      }
    }

    // Essayons de détecter la plateforme à partir de vimeoUrl ou videoUrl
    const url = podcast.vimeoUrl || podcast.videoUrl;
    if (!url) return null;

    try {
      const videoUrl = new URL(url);
      const hostname = videoUrl.hostname.toLowerCase();
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId;
        if (hostname.includes('youtu.be')) {
          videoId = videoUrl.pathname.substring(1);
        } else if (videoUrl.pathname.includes('/embed/')) {
          videoId = videoUrl.pathname.split('/embed/')[1];
        } else {
          videoId = videoUrl.searchParams.get('v');
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
        }
      }
      
      // Vimeo
      else if (hostname.includes('vimeo.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        const videoId = pathParts[0];
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }
      
      // Dailymotion
      else if (hostname.includes('dailymotion.com')) {
        let videoId;
        if (videoUrl.pathname.includes('/video/')) {
          videoId = videoUrl.pathname.split('/video/')[1];
        } else {
          const pathParts = videoUrl.pathname.split('/').filter(Boolean);
          videoId = pathParts[pathParts.length - 1];
        }
        if (videoId) {
          return `https://www.dailymotion.com/embed/video/${videoId}`;
        }
      }

      // Si c'est déjà une URL d'embed, la retourner telle quelle
      if (url.includes('embed') || url.includes('player')) {
        return url;
      }
      
    } catch (error) {
      console.error('Error parsing video URL:', error);
    }
    
    // En dernier recours, retourner l'URL d'origine
    return url;
  };

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Détection des changements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Obtenir l'URL d'embed
  const embedUrl = getVideoEmbedUrl();
  const openExternalLink = () => {
    if (podcast && (podcast.vimeoUrl || podcast.videoUrl)) {
      window.open(podcast.vimeoUrl || podcast.videoUrl, '_blank');
    }
  };

  if (!podcast) {
    return (
      <div className={styles.playerPlaceholder}>
        <p>Aucun podcast sélectionné</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.playerError}>
        <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
        <p>Erreur de chargement: {error}</p>
        <button className={styles.externalLinkButton} onClick={openExternalLink}>
          <FontAwesomeIcon icon={faExternalLinkAlt} /> Voir sur le site original
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${styles.playerContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {embedUrl ? (
        <>
          <iframe
            ref={playerRef}
            src={embedUrl}
            title={podcast.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.videoPlayer}
            onError={() => setError("Impossible de charger la vidéo")}
          ></iframe>
          <div className={styles.playerControls}>
            <button
              className={styles.fullscreenButton}
              onClick={toggleFullscreen}
            >
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </button>
            <button
              className={styles.externalLinkButton}
              onClick={openExternalLink}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.playerUnavailable}>
          <p>Lecteur vidéo non disponible</p>
          {(podcast.vimeoUrl || podcast.videoUrl) && (
            <button className={styles.externalLinkButton} onClick={openExternalLink}>
              <FontAwesomeIcon icon={faExternalLinkAlt} /> Voir sur le site original
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;