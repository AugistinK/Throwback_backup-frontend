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
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import CommentForm from './CommentForm';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import styles from './CommentItem.module.css';

const CommentItem = ({ comment, postId, onUpdateComment, onDeleteComment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
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

  // Handle like/unlike with improved error handling
  const handleLikeClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/api/comments/${commentId}/like`);
      
      if (response.data && response.data.data) {
        // Update local comment state
        const updatedComment = {
          ...comment,
          userInteraction: {
            ...comment.userInteraction,
            liked: response.data.data.liked,
            disliked: response.data.data.disliked
          },
          likes: response.data.data.likes,
          dislikes: response.data.data.dislikes
        };
        
        // Notify parent component
        if (onUpdateComment) {
          onUpdateComment(updatedComment);
        }
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dislike with improved error handling
  const handleDislikeClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/api/comments/${commentId}/dislike`);
      
      if (response.data && response.data.data) {
        // Update local comment state
        const updatedComment = {
          ...comment,
          userInteraction: {
            ...comment.userInteraction,
            liked: response.data.data.liked,
            disliked: response.data.data.disliked
          },
          likes: response.data.data.likes,
          dislikes: response.data.data.dislikes
        };
        
        // Notify parent component
        if (onUpdateComment) {
          onUpdateComment(updatedComment);
        }
      }
    } catch (err) {
      console.error('Error disliking comment:', err);
      setError('Une erreur est survenue');
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
      
      const response = await api.get(`/api/comments/${commentId}/replies`);
      
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
  const handleDeleteClick = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setShowDropdown(false);
      
      await api.delete(`/api/comments/${commentId}`);
      
      // Notify parent component
      if (onDeleteComment) {
        onDeleteComment(commentId);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Impossible de supprimer le commentaire');
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
      
      await api.post(`/api/comments/${commentId}/report`, { raison: reason });
      
      alert('Commentaire signalé avec succès');
    } catch (err) {
      console.error('Error reporting comment:', err);
      setError('Impossible de signaler le commentaire');
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if user can edit/delete
  const isAuthor = user && comment.auteur && 
                  (comment.auteur._id === user.id || comment.auteur.id === user.id);
  const isAdmin = user && user.role && ['admin', 'superadmin'].includes(user.role);
  const canModify = isAuthor || isAdmin;

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <img 
          src={comment.auteur?.photo_profil || '/images/default-avatar.jpg'} 
          alt={comment.auteur?.prenom || 'User'} 
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
            <textarea
              className={styles.editInput}
              defaultValue={comment.contenu}
              rows={3}
            />
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
        
        {canModify && (
          <div className={styles.dropdownContainer}>
            <button 
              className={styles.moreButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showDropdown && (
              <div className={styles.dropdown}>
                {isAuthor && (
                  <button onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                )}
                
                {canModify && (
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
            <div key={reply._id || reply.id} className={styles.replyItem}>
              <img 
                src={reply.auteur?.photo_profil || '/images/default-avatar.jpg'} 
                alt={reply.auteur?.prenom || 'User'} 
                className={styles.replyAvatar}
              />
              
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
    </div>
  );
};

export default CommentItem;