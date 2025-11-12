// VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faExpand, faCompress, faExternalLinkAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ podcast }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const getVideoEmbedUrl = () => {
    if (!podcast) return null;
    if (podcast.videoId && podcast.platform) {
      switch (podcast.platform) {
        case 'YOUTUBE': return `https://www.youtube.com/embed/${podcast.videoId}?autoplay=0&rel=0`;
        case 'VIMEO': return `https://player.vimeo.com/video/${podcast.videoId}`;
        case 'DAILYMOTION': return `https://www.dailymotion.com/embed/video/${podcast.videoId}`;
        default: break;
      }
    }
    const url = podcast.vimeoUrl || podcast.videoUrl;
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        let id;
        if (host.includes('youtu.be')) id = u.pathname.substring(1);
        else if (u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1];
        else id = u.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
      } else if (host.includes('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean)[0];
        if (id) return `https://player.vimeo.com/video/${id}`;
      } else if (host.includes('dailymotion.com')) {
        let id;
        if (u.pathname.includes('/video/')) id = u.pathname.split('/video/')[1];
        else id = u.pathname.split('/').filter(Boolean).pop();
        if (id) return `https://www.dailymotion.com/embed/video/${id}`;
      }
      if (url.includes('embed') || url.includes('player')) return url;
    } catch {}
    return url;
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

  const embedUrl = getVideoEmbedUrl();
  const openExternalLink = () => {
    if (podcast && (podcast.vimeoUrl || podcast.videoUrl)) {
      window.open(podcast.vimeoUrl || podcast.videoUrl, '_blank');
    }
  };

  if (!podcast) return <div className={styles.playerPlaceholder}><p>Aucun podcast sélectionné</p></div>;

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
            <button className={styles.fullscreenButton} onClick={toggleFullscreen}>
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </button>
            <button className={styles.externalLinkButton} onClick={openExternalLink}>
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
