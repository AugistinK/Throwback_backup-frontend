// PodcastPlayer.jsx
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

  const getEmbedUrl = () => {
    if (!podcast) return null;
    if (typeof podcast.getEmbedUrl === 'function') return podcast.getEmbedUrl();
    if (podcast.videoId) {
      switch (podcast.platform) {
        case 'YOUTUBE': return `https://www.youtube.com/embed/${podcast.videoId}?autoplay=${isPlaying?'1':'0'}&mute=${isMuted?'1':'0'}&rel=0&showinfo=1&enablejsapi=1`;
        case 'VIMEO': return `https://player.vimeo.com/video/${podcast.videoId}?autoplay=${isPlaying?'1':'0'}&muted=${isMuted?'1':'0'}&title=1&byline=1&portrait=1`;
        case 'DAILYMOTION': return `https://www.dailymotion.com/embed/video/${podcast.videoId}?autoplay=${isPlaying?'true':'false'}&mute=${isMuted?'true':'false'}`;
        default: break;
      }
    }
    if (podcast.videoUrl && (podcast.videoUrl.includes('embed') || podcast.videoUrl.includes('player'))) return podcast.videoUrl;

    if (podcast.videoUrl) {
      try {
        const url = new URL(podcast.videoUrl);
        const host = url.hostname.toLowerCase();
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
          let id;
          if (host.includes('youtu.be')) id = url.pathname.substring(1);
          else if (url.pathname.includes('/embed/')) id = url.pathname.split('/embed/')[1];
          else if (url.pathname.includes('/shorts/')) id = url.pathname.split('/shorts/')[1];
          else id = url.searchParams.get('v');
          if (id) return `https://www.youtube.com/embed/${id}?autoplay=${isPlaying?'1':'0'}&mute=${isMuted?'1':'0'}&rel=0&showinfo=1&enablejsapi=1`;
        } else if (host.includes('vimeo.com')) {
          const id = url.pathname.split('/').filter(Boolean)[0];
          if (id) return `https://player.vimeo.com/video/${id}?autoplay=${isPlaying?'1':'0'}&muted=${isMuted?'1':'0'}&title=1&byline=1&portrait=1`;
        } else if (host.includes('dailymotion.com')) {
          let id;
          if (url.pathname.includes('/video/')) id = url.pathname.split('/video/')[1];
          else id = url.pathname.split('/').filter(Boolean).pop();
          if (id) return `https://www.dailymotion.com/embed/video/${id}?autoplay=${isPlaying?'true':'false'}&mute=${isMuted?'true':'false'}`;
        }
      } catch {}
    }
    return podcast.videoUrl || null;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
      else if (containerRef.current.webkitRequestFullscreen) containerRef.current.webkitRequestFullscreen();
      else if (containerRef.current.msRequestFullscreen) containerRef.current.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  useEffect(() => {
    const cb = () => setIsFullscreen(
      document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement
    );
    document.addEventListener('fullscreenchange', cb);
    document.addEventListener('webkitfullscreenchange', cb);
    document.addEventListener('msfullscreenchange', cb);
    return () => {
      document.removeEventListener('fullscreenchange', cb);
      document.removeEventListener('webkitfullscreenchange', cb);
      document.removeEventListener('msfullscreenchange', cb);
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      const src = getEmbedUrl();
      if (src) playerRef.current.src = src;
    }
  }, [isPlaying, isMuted]);

  const embedUrl = getEmbedUrl();

  if (!podcast) return <div className={styles.playerPlaceholder}><p>Aucun podcast sélectionné</p></div>;
  if (error) {
    return (
      <div className={styles.playerError}>
        <p>Erreur de chargement: {error}</p>
        <p>Essayez sur <a href={podcast.videoUrl} target="_blank" rel="noopener noreferrer">{podcast.platform || 'la plateforme d\'origine'}</a>.</p>
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
            <button className={styles.playButton} onClick={() => setIsPlaying(!isPlaying)}>
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <button className={styles.muteButton} onClick={() => setIsMuted(!isMuted)}>
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
            </button>
            <button className={styles.fullscreenButton} onClick={toggleFullscreen}>
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
