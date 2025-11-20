// components/Shorts/LoadingSpinner.jsx
import React from 'react';
import styles from './Shorts.module.css';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>{message}</p>
    </div>
  );
};

export default React.memo(LoadingSpinner);