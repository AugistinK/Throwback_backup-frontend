// components/Shorts/FeedbackToast.jsx
import React from 'react';
import styles from './Shorts.module.css';

const FeedbackToast = ({ feedback }) => {
  if (!feedback.visible) return null;

  return (
    <div 
      className={`${styles.feedback} ${styles[feedback.type]}`} 
      role="alert"
    >
      {feedback.message}
    </div>
  );
};

export default React.memo(FeedbackToast);