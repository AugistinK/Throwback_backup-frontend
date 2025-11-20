// components/Shorts/PaginationIndicator.jsx
import React from 'react';
import styles from './Shorts.module.css';

const PaginationIndicator = ({ totalShorts, centerIdx, onSelectIndex }) => {
  if (totalShorts <= 1) return null;

  return (
    <div className={styles.paginationIndicator}>
      {Array.from({ length: totalShorts }, (_, idx) => (
        <span
          key={idx}
          className={`${styles.paginationDot} ${idx === centerIdx ? styles.activeDot : ''}`}
          onClick={() => onSelectIndex(idx)}
          role="button"
          tabIndex="0"
          aria-label={`Go to short ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export default React.memo(PaginationIndicator);