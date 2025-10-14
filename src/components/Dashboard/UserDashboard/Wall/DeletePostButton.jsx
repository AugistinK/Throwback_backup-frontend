// components/Dashboard/UserDashboard/Wall/DeletePostButton.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faExclamationTriangle, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { socialAPI } from '../../../../utils/api';
import styles from './DeletePostButton.module.css';

const DeletePostButton = ({ postId, onPostDeleted }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ouvrir la boîte de dialogue de confirmation
  const handleShowConfirmation = () => {
    setShowConfirmation(true);
    setError(null); // Réinitialiser l'erreur
  };

  // Fermer la boîte de dialogue de confirmation
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  // Supprimer le post
  const handleDeletePost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await socialAPI.deletePost(postId);
      
      setShowConfirmation(false);
      
      // Callback après suppression
      if (onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to delete this post.');
      } else if (err.response?.status === 404) {
        setError('Post not found. It may have been already deleted.');
        
        // Post déjà supprimé, déclencher le callback quand même
        if (onPostDeleted) {
          onPostDeleted(postId);
        }
      } else {
        setError(err.response?.data?.message || 'An error occurred while deleting the post.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleShowConfirmation}
        title="Delete post"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
      
      {showConfirmation && (
        <div className={styles.confirmationModal}>
          <div className={styles.confirmationContent}>
            <div className={styles.confirmationHeader}>
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className={styles.warningIcon} />
                Delete Post
              </h3>
              <button 
                type="button" 
                className={styles.closeButton}
                onClick={handleCloseConfirmation}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className={styles.confirmationBody}>
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>
            
            <div className={styles.confirmationFooter}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={handleCloseConfirmation}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                type="button" 
                className={styles.confirmButton}
                onClick={handleDeletePost}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeletePostButton;