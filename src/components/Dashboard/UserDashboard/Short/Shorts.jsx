// Shorts.jsx - Refactorisé et optimisé
import React, { useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import axios from 'axios';

// Hooks personnalisés
import { useShorts } from '../../../../hooks/useShorts';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';
import { useShortInteractions } from '../../../../hooks/useShortInteractions';
import { useComments } from '../../../../hooks/useComments';
import { useAddShortModal } from '../../../../hooks/useAddShortModal';

// Composants
import LoadingSpinner from './LoadingSpinner';
import ShortCarousel from './ShortCarousel';
import AddShortModal from './AddShortModal';
import FeedbackToast from './FeedbackToast';

import styles from './Shorts.module.css';

// Configuration Axios
axios.interceptors.request.use(
  config => {
    if (config.url && !config.url.startsWith('http')) {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';
      config.url = `${apiBaseUrl}${config.url}`;
    }

    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);

    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - The request took too long');
    }

    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS issue or network problem');
    }

    return Promise.reject(error);
  }
);

export default function Shorts() {
  // Hook pour gérer les shorts
  const {
    shorts,
    centerIdx,
    setCenterIdx,
    isLoadingShorts,
    isLoadingMore,
    hasMoreShorts,
    activeShortId,
    setActiveShortId,
    fetchShorts,
    loadMoreShorts,
    handleNavigate
  } = useShorts();

  // Hook pour gérer le lecteur vidéo
  const videoPlayerProps = useVideoPlayer(centerIdx);

  // Hook pour gérer les interactions
  const {
    isLikeLoading,
    isShareLoading,
    feedback,
    showFeedback,
    handleLike,
    handleShare
  } = useShortInteractions(shorts, fetchShorts);

  // Hook pour gérer les commentaires
  const {
    comments,
    commentInput,
    setCommentInput,
    isCommentsVisible,
    setIsCommentsVisible,
    fetchComments,
    addComment,
    toggleComments
  } = useComments(shorts, fetchShorts, showFeedback);

  // Hook pour gérer le modal d'ajout de short
  const addShortModalProps = useAddShortModal(fetchShorts, showFeedback);

  // Charger les commentaires quand on ouvre la section
  useEffect(() => {
    if (activeShortId && isCommentsVisible) {
      fetchComments(activeShortId);
    }
  }, [activeShortId, isCommentsVisible]);

  // Mettre à jour l'ID actif quand on change de short
  useEffect(() => {
    if (shorts.length > 0 && centerIdx >= 0 && centerIdx < shorts.length) {
      setActiveShortId(shorts[centerIdx]._id);
      setIsCommentsVisible(false);
    }
  }, [centerIdx, shorts]);

  // Navigation au clavier (flèches et espace)
  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      const t = e.target;
      const isEditable = t && (
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.isContentEditable
      );

      if (e.key === 'ArrowLeft' && !isEditable) {
        handleNavigate('left');
        return;
      }

      if (e.key === 'ArrowRight' && !isEditable) {
        handleNavigate('right');
        return;
      }

      if ((e.key === ' ' || e.key === 'Spacebar') && !isEditable) {
        e.preventDefault();
        if (videoPlayerProps.centerVideoRef.current) {
          videoPlayerProps.handlePlayPause();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDownGlobal, { passive: false });
    return () => document.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleNavigate, videoPlayerProps.handlePlayPause]);

  return (
    <div className={styles.shorts_bg}>
      <div className={styles.shortsContentBg}>
        <div className={styles.headerRow}>
          <button 
            className={styles.newPostBtn} 
            onClick={() => addShortModalProps.setShowModal(true)}
          >
            <FaCloudUploadAlt /> Add a Short
          </button>
        </div>

        {isLoadingShorts ? (
          <LoadingSpinner message="Loading shorts..." />
        ) : shorts.length === 0 ? (
          <div className={styles.noContent}>
            <p>No shorts available at the moment.</p>
            <button 
              className={styles.newPostBtn} 
              onClick={() => addShortModalProps.setShowModal(true)}
            >
              Be the first to add a Short!
            </button>
          </div>
        ) : (
          <ShortCarousel
            shorts={shorts}
            centerIdx={centerIdx}
            setCenterIdx={setCenterIdx}
            onNavigate={handleNavigate}
            videoPlayerProps={videoPlayerProps}
            commentsProps={{
              isCommentsVisible,
              comments,
              commentInput,
              setCommentInput,
              onAddComment: () => addComment(activeShortId),
              onToggleComments: toggleComments
            }}
            interactionsProps={{
              isLikeLoading,
              isShareLoading,
              onLike: handleLike,
              onShare: handleShare
            }}
          />
        )}

        {hasMoreShorts && shorts.length > 0 && (
          <div className={styles.loadMoreContainer}>
            <button
              className={styles.loadMoreBtn}
              onClick={loadMoreShorts}
              disabled={isLoadingMore}
              aria-label="Load more shorts"
            >
              {isLoadingMore ? (
                <>
                  <div className={styles.smallSpinner}></div>
                  <span>Loading...</span>
                </>
              ) : 'Load more shorts'}
            </button>
          </div>
        )}
      </div>

      <AddShortModal
        {...addShortModalProps}
        onClose={() => addShortModalProps.setShowModal(false)}
      />

      <FeedbackToast feedback={feedback} />
    </div>
  );
}