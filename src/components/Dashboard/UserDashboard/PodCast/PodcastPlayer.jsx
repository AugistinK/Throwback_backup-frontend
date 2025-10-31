// file_create: /home/claude/PodcastPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeMute, faVolumeUp, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import styles from './PodcastPlayer.module.css';

const PodcastPlayer = ({ podcast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Fonction pour obtenir l'URL d'embed en fonction de la plateforme
  const getEmbedUrl = () => {
    if (!podcast) return null;

    // Utiliser la méthode getEmbedUrl du modèle si disponible
    if (typeof podcast.getEmbedUrl === 'function') {
      return podcast.getEmbedUrl();
    }

    // Sinon, construire l'URL d'embed manuellement
    if (podcast.videoId) {
      switch (podcast.platform) {
        case 'YOUTUBE':
          return `https://www.youtube.com/embed/${podcast.videoId}?autoplay=${isPlaying ? '1' : '0'}&mute=${isMuted ? '1' : '0'}&rel=0&showinfo=1&enablejsapi=1`;
        case 'VIMEO':
          return `https://player.vimeo.com/video/${podcast.videoId}?autoplay=${isPlaying ? '1' : '0'}&muted=${isMuted ? '1' : '0'}&title=1&byline=1&portrait=1`;
        case 'DAILYMOTION':
          return `https://www.dailymotion.com/embed/video/${podcast.videoId}?autoplay=${isPlaying ? 'true' : 'false'}&mute=${isMuted ? 'true' : 'false'}`;
        default:
          break;
      }
    }
    
    // Si c'est déjà une URL d'embed, la retourner
    if (podcast.videoUrl && (podcast.videoUrl.includes('embed') || podcast.videoUrl.includes('player'))) {
      return podcast.videoUrl;
    }
    
    // Sinon, essayer d'analyser l'URL pour extraire l'ID de la vidéo
    if (podcast.videoUrl) {
      try {
        const url = new URL(podcast.videoUrl);
        const hostname = url.hostname.toLowerCase();
        
        // YouTube
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
          let videoId;
          if (hostname.includes('youtu.be')) {
            videoId = url.pathname.substring(1);
          } else if (url.pathname.includes('/embed/')) {
            videoId = url.pathname.split('/embed/')[1];
          } else if (url.pathname.includes('/shorts/')) {
            videoId = url.pathname.split('/shorts/')[1];
          } else {
            videoId = url.searchParams.get('v');
          }
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? '1' : '0'}&mute=${isMuted ? '1' : '0'}&rel=0&showinfo=1&enablejsapi=1`;
          }
        }
        
        // Vimeo
        else if (hostname.includes('vimeo.com')) {
          const pathParts = url.pathname.split('/').filter(Boolean);
          const videoId = pathParts[0];
          if (videoId) {
            return `https://player.vimeo.com/video/${videoId}?autoplay=${isPlaying ? '1' : '0'}&muted=${isMuted ? '1' : '0'}&title=1&byline=1&portrait=1`;
          }
        }
        
        // Dailymotion
        else if (hostname.includes('dailymotion.com')) {
          let videoId;
          if (url.pathname.includes('/video/')) {
            videoId = url.pathname.split('/video/')[1];
          } else {
            const pathParts = url.pathname.split('/').filter(Boolean);
            videoId = pathParts[pathParts.length - 1];
          }
          if (videoId) {
            return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=${isPlaying ? 'true' : 'false'}&mute=${isMuted ? 'true' : 'false'}`;
          }
        }
      } catch (error) {
        console.error('Error parsing video URL:', error);
      }
    }
    
    // En dernier recours, retourner l'URL d'origine
    return podcast.videoUrl || null;
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

  // Recharger l'iframe quand les états changent
  useEffect(() => {
    if (playerRef.current) {
      const src = getEmbedUrl();
      if (src) {
        playerRef.current.src = src;
      }
    }
  }, [isPlaying, isMuted]);

  // Obtenir l'URL d'embed
  const embedUrl = getEmbedUrl();

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
        <p>Erreur de chargement: {error}</p>
        <p>Essayez de regarder directement sur <a href={podcast.videoUrl} target="_blank" rel="noopener noreferrer">{podcast.platform || 'la plateforme d\'origine'}</a>.</p>
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
              className={styles.playButton}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <button
              className={styles.muteButton}
              onClick={() => setIsMuted(!isMuted)}
            >
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
            </button>
            <button
              className={styles.fullscreenButton}
              onClick={toggleFullscreen}
            >
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.playerUnavailable}>
          <p>Lecteur vidéo non disponible</p>
          <a href={podcast.videoUrl} target="_blank" rel="noopener noreferrer">
            Regarder sur {podcast.platform || 'la plateforme d\'origine'}
          </a>
        </div>
      )}
    </div>
  );
};

export default PodcastPlayer;