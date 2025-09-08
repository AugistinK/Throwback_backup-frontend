// components/Dashboard/UserDashboard/Wall/CommentList.jsx
import React, { useState, useEffect } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Spinner from '../../../Common/Spinner';
import api from '../../../../utils/api';
import styles from './CommentList.module.css';

const CommentList = ({ postId, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Charger les commentaires
  const loadComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/posts/${postId}/comments`, {
        params: { page: pageNum, limit: 10 }
      });
      
      const newComments = response.data.data;
      const pagination = response.data.pagination;
      
      if (pageNum === 1) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      
      setHasMore(pagination.page < pagination.totalPages);
      setPage(pagination.page);
      
      // Mettre à jour le compteur de commentaires
      if (onCommentCountChange) {
        onCommentCountChange(pagination.total);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
      setError('Impossible de charger les commentaires');
    } finally {
      setLoading(false);
    }
  };

  // Charger les commentaires au montage
  useEffect(() => {
    loadComments();
  }, [postId]);

  // Fonction pour ajouter un nouveau commentaire
  const handleAddComment = (newComment) => {
    setComments(prev => [newComment, ...prev]);
    
    // Mettre à jour le compteur
    if (onCommentCountChange) {
      onCommentCountChange(prev => prev + 1);
    }
  };

  // Fonction pour mettre à jour un commentaire
  const handleUpdateComment = (updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment._id === updatedComment._id ? updatedComment : comment
      )
    );
  };

  // Fonction pour supprimer un commentaire
  const handleDeleteComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment._id !== commentId));
    
    // Mettre à jour le compteur
    if (onCommentCountChange) {
      onCommentCountChange(prev => prev - 1);
    }
  };

  return (
    <div className={styles.commentListContainer}>
      <CommentForm 
        postId={postId} 
        onCommentAdded={handleAddComment} 
      />
      
      <div className={styles.commentList}>
        {comments.length === 0 && !loading ? (
          <div className={styles.emptyComments}>
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem 
                key={comment._id} 
                comment={comment}
                postId={postId}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            ))}
            
            {loading && (
              <div className={styles.loadingComments}>
                <Spinner size="small" />
                <span>Chargement des commentaires...</span>
              </div>
            )}
            
            {!loading && hasMore && (
              <button 
                className={styles.loadMoreButton}
                onClick={() => loadComments(page + 1)}
              >
                Afficher plus de commentaires
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentList;