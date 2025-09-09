import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import styles from './CommentForm.module.css';

const CommentForm = ({ postId, videoId, parentId = null, onCommentAdded, className = '' }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Détermine l'API à utiliser selon le contexte (post ou vidéo)
      if (postId) {
        // Si c'est un post du ThrowBack Wall
        response = await api.post(`/api/posts/${postId}/comments`, {
          contenu: content,
          parentId: parentId
        });
      } else if (videoId) {
        // Si c'est une vidéo
        response = await api.post(`/api/public/videos/${videoId}/comments`, {
          contenu: content,
          parent_comment: parentId
        });
      } else {
        throw new Error('Un ID de post ou de vidéo est requis');
      }
      
      setContent('');
      
      // Notifier le parent
      if (onCommentAdded) {
        onCommentAdded(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      className={`${styles.commentForm} ${className}`} 
      onSubmit={handleSubmit}
    >
      <img 
        src={user?.photo_profil || '/images/default-avatar.jpg'} 
        alt={user?.prenom} 
        className={styles.userAvatar}
      />
      
      <div className={styles.inputContainer}>
        <textarea
          placeholder={parentId ? "Ajouter une réponse..." : "Ajouter un commentaire..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          className={styles.commentInput}
          rows={1}
        />
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading || !content.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </form>
  );
};

export default CommentForm;