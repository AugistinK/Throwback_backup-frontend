import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faReply, 
  faEllipsisV,
  faEdit,
  faTrash,
  faFlag,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import CommentForm from './CommentForm';
import api from '../../../../utils/api';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import styles from './CommentItem.module.css';

const CommentItem = ({ comment, postId, onUpdateComment, onDeleteComment }) => {
  const [liked, setLiked] = useState(comment.likes?.includes(user?.id));
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.contenu);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyCount, setReplyCount] = useState(0);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Fermer le dropdown au clic en dehors
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Charger les réponses
  const loadReplies = async () => {
    if (repliesLoaded) {
      setShowReplies(!showReplies);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.get(`/api/comments/${comment._id}/replies`);
      
      setReplies(response.data.data);
      setReplyCount(response.data.data.length);
      setRepliesLoaded(true);
      setShowReplies(true);
    } catch (err) {
      console.error('Erreur lors du chargement des réponses:', err);
      setError('Impossible de charger les réponses');
    } finally {
      setLoading(false);
    }
  };

const handleLikeClick = async () => {
  try {
    setLoading(true);
    
    const response = await api.post(`/api/comments/${comment._id}/like`);
    
    setLiked(response.data.data.liked);
    setLikeCount(response.data.data.likes);
    
    // Mettre à jour le commentaire
    if (onUpdateComment) {
      const updatedComment = {
        ...comment,
        likes: response.data.data.likes,
        dislikes: response.data.data.dislikes,
        userInteraction: {
          liked: response.data.data.liked,
          disliked: response.data.data.disliked
        }
      };
      onUpdateComment(updatedComment);
    }
  } catch (err) {
    console.error('Erreur lors du like/unlike:', err);
    setError('Une erreur est survenue');
  } finally {
    setLoading(false);
  }
};

  // Fonction pour supprimer un commentaire
  const handleDeleteClick = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire?')) {
      return;
    }
    
    try {
      setLoading(true);
      setShowDropdown(false);
      
      await api.delete(`/api/comments/${comment._id}`);
      
      if (onDeleteComment) {
        onDeleteComment(comment._id);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour un commentaire
  const handleUpdateClick = async () => {
    try {
      setLoading(true);
      
      const response = await api.put(`/api/comments/${comment._id}`, {
        contenu: editContent
      });
      
      setIsEditing(false);
      
      if (onUpdateComment) {
        onUpdateComment(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour signaler un commentaire
  const handleReportClick = async () => {
    try {
      const raison = prompt('Veuillez indiquer la raison du signalement:');
      
      if (!raison) return;
      
      setLoading(true);
      setShowDropdown(false);
      
      await api.post(`/api/comments/${comment._id}/report`, { raison });
      
      alert('Commentaire signalé avec succès. Notre équipe de modération va examiner ce contenu.');
    } catch (err) {
      console.error('Erreur lors du signalement:', err);
      setError('Une erreur est survenue lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une réponse
  const handleAddReply = (newReply) => {
    setReplies(prev => [newReply, ...prev]);
    setReplyCount(prev => prev + 1);
    setIsReplying(false);
    
    // Si les réponses n'étaient pas affichées, les afficher
    if (!showReplies) {
      setShowReplies(true);
    }
  };

  // Fonction pour mettre à jour une réponse
  const handleUpdateReply = (updatedReply) => {
    setReplies(prev => 
      prev.map(reply => 
        reply._id === updatedReply._id ? updatedReply : reply
      )
    );
  };

  // Fonction pour supprimer une réponse
  const handleDeleteReply = (replyId) => {
    setReplies(prev => prev.filter(reply => reply._id !== replyId));
    setReplyCount(prev => prev - 1);
  };

  // Formater la date
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: fr
  });

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <img 
          src={comment.auteur?.photo_profil || '/images/default-avatar.jpg'} 
          alt={comment.auteur?.prenom} 
          className={styles.userAvatar}
        />
        
        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <span className={styles.userName}>
              {comment.auteur?.prenom} {comment.auteur?.nom}
            </span>
            <span className={styles.commentDate}>{formattedDate}</span>
          </div>
          
          {isEditing ? (
            <div className={styles.editForm}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={styles.editTextarea}
                rows={2}
              />
              
              <div className={styles.editActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.contenu);
                  }}
                >
                  Annuler
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={handleUpdateClick}
                  disabled={loading || !editContent.trim()}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.commentText}>
              {comment.contenu}
            </div>
          )}
          
          <div className={styles.commentActions}>
            <button 
              className={`${styles.actionButton} ${liked ? styles.liked : ''}`}
              onClick={handleLikeClick}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>{likeCount > 0 ? likeCount : ''}</span>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => setIsReplying(!isReplying)}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>Répondre</span>
            </button>
          </div>
        </div>
        
        <div className={styles.commentMenu} ref={dropdownRef}>
          <button 
            className={styles.menuButton}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {showDropdown && (
            <div className={styles.menuDropdown}>
              {comment.auteur?._id === user?.id && (
                <>
                  <button onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                  <button onClick={handleDeleteClick}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                </>
              )}
              <button onClick={handleReportClick}>
                <FontAwesomeIcon icon={faFlag} />
                <span>Signaler</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {isReplying && (
        <div className={styles.replyForm}>
          <CommentForm 
            postId={postId} 
            parentId={comment._id}
            onCommentAdded={handleAddReply}
          />
        </div>
      )}
      
      {replyCount > 0 && !loading && (
        <button 
          className={styles.showRepliesButton}
          onClick={loadReplies}
        >
          <FontAwesomeIcon icon={showReplies ? faChevronUp : faChevronDown} />
          <span>
            {showReplies ? 'Masquer' : 'Afficher'} {replyCount} {replyCount > 1 ? 'réponses' : 'réponse'}
          </span>
        </button>
      )}
      
      {showReplies && replies.length > 0 && (
        <div className={styles.replyList}>
          {replies.map(reply => (
            <CommentItem 
              key={reply._id} 
              comment={reply}
              postId={postId}
              onUpdateComment={handleUpdateReply}
              onDeleteComment={handleDeleteReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;