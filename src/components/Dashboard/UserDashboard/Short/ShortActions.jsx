// components/Shorts/ShortActions.jsx
import React from 'react';
import { FaHeart, FaShareAlt, FaComment, FaStar } from 'react-icons/fa';
import styles from './Shorts.module.css';

const ShortActions = ({ 
  short,
  isLikeLoading,
  isShareLoading,
  onLike,
  onShare,
  onToggleComments,
  isCommentsVisible
}) => {
  return (
    <div className={styles.centerActions}>
      <span className={styles.featured}>
        <FaStar /> Featured
      </span>
      
      <button
        className={`${styles.actionBtn} ${isLikeLoading ? styles.disabled : ''} ${short.userInteraction?.liked ? styles.active : ''}`}
        onClick={() => onLike(short._id)}
        disabled={isLikeLoading}
        aria-label="Like"
      >
        <FaHeart />
        <span className={styles.actionCount}>{short.likes || 0}</span>
      </button>
      
      <button
        className={`${styles.actionBtn} ${isShareLoading ? styles.disabled : ''}`}
        onClick={() => onShare(short._id)}
        disabled={isShareLoading}
        aria-label="Share"
      >
        <FaShareAlt />
      </button>
      
      <button
        className={`${styles.actionBtn} ${isCommentsVisible ? styles.active : ''}`}
        onClick={onToggleComments}
        aria-label="Comments"
      >
        <FaComment />
        <span className={styles.actionCount}>{short.meta?.commentCount || 0}</span>
      </button>
    </div>
  );
};

export default React.memo(ShortActions);