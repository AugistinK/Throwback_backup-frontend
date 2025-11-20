// components/Shorts/ProgressBar.jsx
import React from 'react';
import styles from './Shorts.module.css';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const ProgressBar = ({ progress, duration, onProgressChange }) => {
  return (
    <div className={styles.progressContainer}>
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={progress}
        step={0.1}
        onChange={e => onProgressChange(e.target.value)}
        className={styles.progressBar}
        style={{
          ['--progress']: `${(progress / (duration || 1)) * 100}%`
        }}
        disabled={duration === 0}
        aria-label="Video progress"
      />

      <div className={styles.timeDisplay}>
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);