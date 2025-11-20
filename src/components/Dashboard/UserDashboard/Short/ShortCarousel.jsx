// components/Shorts/ShortCarousel.jsx
import React, { useRef, useState } from 'react';
import CenterShortCard from './CenterShortCard';
import SideShortCard from './SideShortCard';
import NavigationButtons from './NavigationButtons';
import PaginationIndicator from './PaginationIndicator';
import styles from './Shorts.module.css';

const ShortCarousel = ({
  shorts,
  centerIdx,
  setCenterIdx,
  onNavigate,
  videoPlayerProps,
  commentsProps,
  interactionsProps
}) => {
  const [direction, setDirection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const touchStartXRef = useRef(null);

  const handleNavigateWithAnimation = (dir) => {
    setDirection(dir);
    onNavigate(dir);
    setTimeout(() => setDirection(null), 300);
  };

  const handleSideCardClick = (realIdx) => {
    if (realIdx === centerIdx) return;
    const dir = realIdx > centerIdx ? 'right' : 'left';
    handleNavigateWithAnimation(dir);
  };

  // Calculate window of 5 shorts centered on centerIdx
  const getVisibleShorts = () => {
    const window = [];
    for (let i = centerIdx - 2; i <= centerIdx + 2; i++) {
      if (i < 0 || i >= shorts.length) {
        window.push(null);
      } else {
        window.push({ short: shorts[i], realIdx: i });
      }
    }
    return window;
  };

  return (
    <div className={`${styles.carouselContainer} ${direction === 'left' ? styles.swipeLeft : direction === 'right' ? styles.swipeRight : ''}`}>
      <div
        className={styles.carouselRow}
        onTouchStart={(e) => {
          setDragging(false);
          touchStartXRef.current = e.touches[0].clientX;
        }}
        onTouchMove={() => {
          setDragging(true);
        }}
        onTouchEnd={(e) => {
          if (dragging) {
            const touchEndX = e.changedTouches[0].clientX;
            const dx = touchEndX - (touchStartXRef.current ?? 0);
            if (Math.abs(dx) > 80) {
              handleNavigateWithAnimation(dx < 0 ? 'right' : 'left');
            }
          }
          touchStartXRef.current = null;
        }}
      >
        {getVisibleShorts().map((item, idx) => {
          if (!item) {
            return <div className={styles.sideCard} key={`empty-${idx}`} style={{ opacity: 0.3 }} />;
          }

          const { short, realIdx } = item;

          if (idx === 2) {
            // Center card
            return (
              <CenterShortCard
                key={short._id}
                short={short}
                {...videoPlayerProps}
                {...commentsProps}
                {...interactionsProps}
              />
            );
          } else {
            // Side cards
            return (
              <SideShortCard
                key={short._id}
                short={short}
                onClick={() => handleSideCardClick(realIdx)}
              />
            );
          }
        })}
      </div>

      <NavigationButtons
        centerIdx={centerIdx}
        totalShorts={shorts.length}
        onNavigate={handleNavigateWithAnimation}
      />

      <PaginationIndicator
        totalShorts={shorts.length}
        centerIdx={centerIdx}
        onSelectIndex={setCenterIdx}
      />
    </div>
  );
};

export default React.memo(ShortCarousel);