// components/Shorts/NavigationButtons.jsx
import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './Shorts.module.css';

const NavigationButtons = ({ centerIdx, totalShorts, onNavigate }) => {
  if (totalShorts <= 1) return null;

  return (
    <>
      {centerIdx > 0 && (
        <button
          className={`${styles.navButton} ${styles.leftNav}`}
          onClick={() => onNavigate('left')}
          aria-label="Previous short"
        >
          <FaChevronLeft />
        </button>
      )}

      {centerIdx < totalShorts - 1 && (
        <button
          className={`${styles.navButton} ${styles.rightNav}`}
          onClick={() => onNavigate('right')}
          aria-label="Next short"
        >
          <FaChevronRight />
        </button>
      )}
    </>
  );
};

export default React.memo(NavigationButtons);