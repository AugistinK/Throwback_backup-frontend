// components/Shorts/VideoControls.jsx
import React from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import styles from './Shorts.module.css';

const VideoControls = ({ 
  isPlaying, 
  isMuted, 
  showControls, 
  onPlayPause, 
  onMuteToggle 
}) => {
  // Le bouton Play ne s'affiche que si la vidéo est en pause OU au survol
  const shouldShowPlayButton = !isPlaying || showControls;

  return (
    <>
      {/* Bouton Play/Pause - visible seulement si en pause ou au survol */}
      {shouldShowPlayButton && (
        <button
          className={styles.playBtn}
          onClick={onPlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      )}
      
      {/* Bouton Mute/Unmute - toujours visible */}
      <button
        className={styles.muteBtn}
        onClick={onMuteToggle}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? 
          <FaVolumeMute style={{ fontSize: '1.5rem' }} /> : 
          <FaVolumeUp style={{ fontSize: '1.5rem' }} />
        }
      </button>
    </>
  );
};

export default React.memo(VideoControls);