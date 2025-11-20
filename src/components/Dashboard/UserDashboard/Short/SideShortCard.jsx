// components/Shorts/SideShortCard.jsx
import React from 'react';
import { FaPlay } from 'react-icons/fa';
import styles from './Shorts.module.css';

const SideShortCard = ({ short, onClick }) => {
  return (
    <div
      className={styles.sideCard}
      onClick={onClick}
      role="button"
      tabIndex="0"
      aria-label={`View short ${short.titre}`}
    >
      <video
        src={short.youtubeUrl}
        controls={false}
        className={styles.sideImg}
        autoPlay={false}
        muted
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('Video loading error:', e);
          e.target.src = '/images/video-error.jpg';
        }}
      />
      <div className={styles.views}>
        <FaPlay /> {short.duree || 0}s
      </div>
    </div>
  );
};

export default React.memo(SideShortCard);