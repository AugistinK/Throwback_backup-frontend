// components/Dashboard/UserDashboard/Wall/DeletePostButton.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faExclamationTriangle, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import styles from './DeletePostButton.module.css';

const DeletePostButton = ({ postId, postAuthorId, onPostDeleted }) => {
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Vérification stricte des permissions
  const isAuthor = user && postAuthorId && (
    user.id === postAuthorId || 
    user._id === postAuthorId
  );
  
  const isAdmin = user && (
    (user.roles && Array.isArray(user.roles) && user.roles.some(r => 
      r.libelle_role && ['admin', 'superadmin'].includes(r.libelle_role.toLowerCase())
    )) ||
    (user.role && ['admin', 'superadmin'].includes(user.role.toLowerCase()))
  );

  // ✅ Ne pas afficher le bouton si pas de permissions
  if (!isAuthor && !isAdmin) {
    return null;
  }

  // Ouvrir la boîte de dialogue de confirmation
  const handleShowConfirmation = () => {
    setShowConfirmation(true);
    setError(null); // Réinitialiser l'erreur
  };

  // Fermer la boîte de dialogue de confirmation
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setError(null);
  };

  // Supprimer le post
 const handleDeletePost = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Utiliser api.delete au lieu de socialAPI.deletePost
    await api.delete(`/api/posts/${postId}`);
    
    setShowConfirmation(false);
    
    // Callback après suppression
    if (onPostDeleted) {
      onPostDeleted(postId);
    }
  } catch (err) {
    console.error('Erreur lors de la suppression du post:', err);
    // Le reste de la gestion d'erreur reste identique
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
        title={isAdmin && !isAuthor ? "Delete (Admin)" : "Delete post"}
      >
        <FontAwesomeIcon icon={faTrash} />
        <span>Delete</span>
        {/* ✅ Badge Admin si c'est un admin qui supprime le post d'un autre */}
        {isAdmin && !isAuthor && (
          <span className={styles.adminBadge}>Admin</span>
        )}
      </button>
      
      {showConfirmation && (
        <div className={styles.confirmationModal} onClick={handleCloseConfirmation}>
          <div 
            className={styles.confirmationContent}
            onClick={(e) => e.stopPropagation()} // Empêcher la fermeture au clic sur le contenu
          >
            <div className={styles.confirmationHeader}>
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className={styles.warningIcon} />
                Delete Post
              </h3>
              <button 
                type="button" 
                className={styles.closeButton}
                onClick={handleCloseConfirmation}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className={styles.confirmationBody}>
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              
              {/* ✅ Avertissement spécial pour les admins */}
              {isAdmin && !isAuthor && (
                <div className={styles.adminWarning}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>You are deleting a post as an administrator.</span>
                </div>
              )}
              
              {error && (
                <div className={styles.errorMessage}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{error}</span>
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
                className={`${styles.confirmButton} ${isAdmin && !isAuthor ? styles.adminDelete : ''}`}
                onClick={handleDeletePost}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeletePostButton;