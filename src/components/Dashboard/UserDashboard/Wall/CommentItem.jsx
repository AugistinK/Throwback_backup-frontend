// components/Dashboard/UserDashboard/Wall/CommentItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faReply, 
  faEdit, 
  faTrash,
  faThumbsDown,
  faFlag,
  faEllipsisV,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import CommentForm from './CommentForm';
import AvatarInitials from '../../../Common/AvatarInitials';
import ConfirmDialog from '../../../Common/ConfirmDialog';
import { errorMessages } from '../../../../utils/errorMessages';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import styles from './CommentItem.module.css';

const CommentItem = ({ comment, postId, onUpdateComment, onDeleteComment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.contenu);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Safely get comment ID
  const commentId = comment._id || comment.id;
  
  // Safely extract liked status
  const isLiked = comment.userInteraction?.liked || false;
  const isDisliked = comment.userInteraction?.disliked || false;
  
  // Get like/dislike counts safely
  const likeCount = comment.likes || 0;
  const dislikeCount = comment.dislikes || 0;
  
  // Format creation date safely
  const creationDate = comment.creation_date || comment.createdAt || new Date();
  const formattedDate = formatDistanceToNow(new Date(creationDate), {
    addSuffix: true,
    locale: fr
  });

  // Handle like/unlike avec une gestion d'erreur améliorée
  const handleLikeClick = async () => {
    try {
      // Empêcher les clics multiples pendant le chargement
      if (loading) return;
      
      // Mise à jour optimiste de l'interface avant confirmation du serveur
      const optimisticUpdate = {
        ...comment,
        userInteraction: {
          ...comment.userInteraction,
          liked: !isLiked,
          disliked: false // Désactiver dislike si on like
        },
        likes: isLiked ? likeCount - 1 : likeCount + 1,
        dislikes: isDisliked ? dislikeCount - 1 : dislikeCount
      };
      
      // Mettre à jour l'UI immédiatement
      if (onUpdateComment) {
        onUpdateComment(optimisticUpdate);
      }
      
      setLoading(true);
      setError(null);
      
      // Ajouter un timeout et retry avec backoff exponentiel
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          const response = await api.post(`/api/comments/${commentId}/like`);
          console.log('Like response:', response.data);
          success = true;
          
          // Mettre à jour avec les données réelles du serveur si disponibles
          if (response.data && response.data.data) {
            const serverUpdatedComment = {
              ...comment,
              userInteraction: {
                ...comment.userInteraction,
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              },
              likes: response.data.data.likes,
              dislikes: response.data.data.dislikes
            };
            
            if (onUpdateComment) {
              onUpdateComment(serverUpdatedComment);
            }
          }
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) throw err;
          // Attendre avant de réessayer (backoff exponentiel)
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      setError("Impossible d'aimer ce commentaire. Veuillez réessayer.");
      
      // Restaurer l'état précédent en cas d'erreur
      if (onUpdateComment) {
        onUpdateComment(comment);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dislike avec une gestion d'erreur améliorée
  const handleDislikeClick = async () => {
    try {
      // Empêcher les clics multiples pendant le chargement
      if (loading) return;
      
      // Mise à jour optimiste de l'interface avant confirmation du serveur
      const optimisticUpdate = {
        ...comment,
        userInteraction: {
          ...comment.userInteraction,
          disliked: !isDisliked,
          liked: false // Désactiver like si on dislike
        },
        dislikes: isDisliked ? dislikeCount - 1 : dislikeCount + 1,
        likes: isLiked ? likeCount - 1 : likeCount
      };
      
      // Mettre à jour l'UI immédiatement
      if (onUpdateComment) {
        onUpdateComment(optimisticUpdate);
      }
      
      setLoading(true);
      setError(null);
      
      // Ajouter un timeout et retry avec backoff exponentiel
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          const response = await api.post(`/api/comments/${commentId}/dislike`);
          console.log('Dislike response:', response.data);
          success = true;
          
          // Mettre à jour avec les données réelles du serveur si disponibles
          if (response.data && response.data.data) {
            const serverUpdatedComment = {
              ...comment,
              userInteraction: {
                ...comment.userInteraction,
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              },
              likes: response.data.data.likes,
              dislikes: response.data.data.dislikes
            };
            
            if (onUpdateComment) {
              onUpdateComment(serverUpdatedComment);
            }
          }
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) throw err;
          // Attendre avant de réessayer (backoff exponentiel)
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (err) {
      console.error('Error disliking comment:', err);
      setError("Impossible de ne pas aimer ce commentaire. Veuillez réessayer.");
      
      // Restaurer l'état précédent en cas d'erreur
      if (onUpdateComment) {
        onUpdateComment(comment);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load more replies with error handling
  const loadReplies = async () => {
    if (!commentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading replies for comment: ${commentId}`);
      const response = await api.get(`/api/comments/${commentId}/replies`);
      
      console.log('Replies response:', response.data);
      
      if (response.data && (response.data.data || Array.isArray(response.data))) {
        const loadedReplies = response.data.data || response.data;
        setReplies(loadedReplies);
        setShowReplies(true);
      }
    } catch (err) {
      console.error('Error loading replies:', err);
      setError('Impossible de charger les réponses');
    } finally {
      setLoading(false);
    }
  };
  
  // Add reply handler
  const handleAddReply = (newReply) => {
    setReplies(prev => [newReply, ...prev]);
    setShowReplyForm(false);
    setShowReplies(true);
    
    // Update total replies count in parent comment
    const updatedComment = {
      ...comment,
      totalReplies: (comment.totalReplies || 0) + 1,
      hasMoreReplies: true
    };
    
    if (onUpdateComment) {
      onUpdateComment(updatedComment);
    }
  };
  
  // Delete comment handler
  const handleDeleteClick = () => {
    setShowDropdown(false);
    setShowDeleteConfirm(true);
  };
  
  // Confirmed delete handler
  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Deleting comment: ${commentId}`);
      const response = await api.delete(`/api/comments/${commentId}`);
      
      console.log('Delete response:', response.data);
      
      // Notify parent component
      if (onDeleteComment) {
        onDeleteComment(commentId);
      }
      
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError("Impossible de supprimer ce commentaire. Veuillez réessayer.");
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Handle update comment
  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Updating comment: ${commentId}`);
      const response = await api.put(`/api/comments/${commentId}`, {
        contenu: editContent
      });
      
      console.log('Update response:', response.data);
      
      if (response.data && response.data.data) {
        const updatedComment = {
          ...comment,
          contenu: editContent,
          modified_date: new Date()
        };
        
        // Notify parent component
        if (onUpdateComment) {
          onUpdateComment(updatedComment);
        }
        
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError("Impossible de modifier ce commentaire. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  // Report comment handler
  const handleReportClick = async () => {
    try {
      setShowDropdown(false);
      
      const reason = prompt('Veuillez indiquer la raison du signalement:');
      if (!reason) return;
      
      setLoading(true);
      setError(null);
      
      console.log(`Reporting comment: ${commentId}`);
      const response = await api.post(`/api/comments/${commentId}/report`, { raison: reason });
      
      console.log('Report response:', response.data);
      
      alert('Commentaire signalé avec succès');
    } catch (err) {
      console.error('Error reporting comment:', err);
      setError('Impossible de signaler le commentaire');
    } finally {
      setLoading(false);
    }
  };
  
  // Amélioration de la détermination des droits
  const isAuthor = user && comment.auteur && 
                  (comment.auteur._id === user.id || comment.auteur.id === user.id);
  const isAdmin = user && (
    (user.roles && user.roles.some(r => ['admin', 'superadmin'].includes(r.libelle_role))) ||
    ['admin', 'superadmin'].includes(user.role)
  );

  // Modifier pour restreindre les permissions
  const canModify = isAuthor; // Seul l'auteur peut modifier son commentaire
  const canDelete = isAuthor || isAdmin; // L'auteur et les admins peuvent supprimer

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        {comment.auteur?.photo_profil ? (
          <img 
            src={comment.auteur.photo_profil} 
            alt={`${comment.auteur.prenom} ${comment.auteur.nom}`} 
            className={styles.userAvatar}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : (
          <AvatarInitials 
            user={comment.auteur} 
            className={styles.userAvatar} 
          />
        )}
        
        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <span className={styles.userName}>
              {comment.auteur?.prenom} {comment.auteur?.nom}
            </span>
            <span className={styles.commentDate}>{formattedDate}</span>
          </div>
          
          {isEditing ? (
            <>
              <textarea
                className={styles.editInput}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className={styles.editButtons}>
                <button 
                  className={styles.cancelEditButton}
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.contenu);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Annuler</span>
                </button>
                <button 
                  className={styles.saveEditButton}
                  onClick={handleUpdateComment}
                  disabled={loading || !editContent.trim()}
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>Enregistrer</span>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.commentText}>
              {comment.contenu}
            </div>
          )}
          
          <div className={styles.commentActions}>
            <button 
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLikeClick}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>{likeCount}</span>
            </button>
            
            <button 
              className={`${styles.actionButton} ${isDisliked ? styles.disliked : ''}`}
              onClick={handleDislikeClick}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faThumbsDown} />
              <span>{dislikeCount}</span>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => setShowReplyForm(!showReplyForm)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>Répondre</span>
            </button>
            
            {comment.totalReplies > 0 && !showReplies && (
              <button 
                className={styles.actionButton}
                onClick={loadReplies}
                disabled={loading}
              >
                <span>Voir les {comment.totalReplies} réponses</span>
              </button>
            )}
            
            {showReplies && comment.totalReplies > 0 && (
              <button 
                className={styles.actionButton}
                onClick={() => setShowReplies(false)}
              >
                <span>Masquer les réponses</span>
              </button>
            )}
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
        
        {user && (
          <div className={styles.dropdownContainer}>
            <button 
              className={styles.moreButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showDropdown && (
              <div className={styles.dropdown}>
                {canModify && (
                  <button onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                )}
                
                {canDelete && (
                  <button onClick={handleDeleteClick}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                )}
                
                {!isAuthor && (
                  <button onClick={handleReportClick}>
                    <FontAwesomeIcon icon={faFlag} />
                    <span>Signaler</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showReplyForm && (
        <div className={styles.replyForm}>
          <CommentForm 
            postId={postId}
            parentId={commentId}
            onCommentAdded={handleAddReply}
            onCancel={() => setShowReplyForm(false)}
            onError={setError}
          />
        </div>
      )}
      
      {showReplies && replies.length > 0 && (
        <div className={styles.repliesList}>
          {replies.map(reply => (
            <div key={reply._id || reply.id || `reply-${Math.random()}`} className={styles.replyItem}>
              {reply.auteur?.photo_profil ? (
                <img 
                  src={reply.auteur.photo_profil} 
                  alt={`${reply.auteur.prenom} ${reply.auteur.nom}`} 
                  className={styles.replyAvatar}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <AvatarInitials 
                  user={reply.auteur} 
                  size={24}
                  className={styles.replyAvatar} 
                />
              )}
              
              <div className={styles.replyContent}>
                <div className={styles.replyMeta}>
                  <span className={styles.replyUserName}>
                    {reply.auteur?.prenom} {reply.auteur?.nom}
                  </span>
                  <span className={styles.replyDate}>
                    {formatDistanceToNow(new Date(reply.creation_date || reply.createdAt), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                </div>
                
                <div className={styles.replyText}>
                  {reply.contenu}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default CommentItem;