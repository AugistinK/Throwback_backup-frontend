// components/Dashboard/UserDashboard/Wall/CommentItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faReply, faEdit, faTrash, faThumbsDown, faFlag, faEllipsisV, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../../../contexts/AuthContext';
import CommentForm from './CommentForm';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import ConfirmDialog from '../../../Common/ConfirmDialog';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const commentId = comment._id || comment.id;
  const creationDate = comment.creation_date || comment.createdAt || new Date();
  const formattedDate = formatDistanceToNow(new Date(creationDate), { addSuffix: true, locale: fr });

  const isLiked = !!comment.userInteraction?.liked;
  const isDisliked = !!comment.userInteraction?.disliked;
  const likeCount = comment.likes || 0;
  const dislikeCount = comment.dislikes || 0;

  const canEditOrDelete = String(comment?.auteur?._id || '') === String(user?.id || user?._id || '');

  const optimisticPatch = (patch) => {
    onUpdateComment?.({ ...comment, ...patch, userInteraction: { ...(comment.userInteraction || {}), ...patch.userInteraction } });
  };

  const handleLikeClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    // optimiste: toggle like & clear dislike
    optimisticPatch({
      userInteraction: { liked: !isLiked, disliked: false },
      likes: isLiked ? likeCount - 1 : likeCount + 1,
      dislikes: isDisliked ? Math.max(dislikeCount - 1, 0) : dislikeCount,
    });

    try {
      await api.post(`/api/comments/${commentId}/like`);
    } catch (e) {
      // rollback sur erreur
      optimisticPatch({
        userInteraction: { liked: isLiked, disliked: isDisliked },
        likes: likeCount,
        dislikes: dislikeCount,
      });
      setError("Impossible d'aimer ce commentaire. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDislikeClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    optimisticPatch({
      userInteraction: { liked: false, disliked: !isDisliked },
      dislikes: isDisliked ? dislikeCount - 1 : dislikeCount + 1,
      likes: isLiked ? Math.max(likeCount - 1, 0) : likeCount,
    });

    try {
      await api.post(`/api/comments/${commentId}/dislike`);
    } catch (e) {
      optimisticPatch({
        userInteraction: { liked: isLiked, disliked: isDisliked },
        likes: likeCount,
        dislikes: dislikeCount,
      });
      setError("Impossible de ne pas aimer ce commentaire. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      setLoading(true);
      const { data } = await api.put(`/api/comments/${commentId}`, { contenu: editContent });
      onUpdateComment?.(data?.data || data);
      setIsEditing(false);
    } catch (e) {
      setError("Impossible de modifier ce commentaire.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/api/comments/${commentId}`);
      onDeleteComment?.(commentId);
    } catch (e) {
      setError("Impossible de supprimer ce commentaire.");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.avatar}>
        {comment?.auteur?.photo_profil ? (
          <img src={comment.auteur.photo_profil} alt={`${comment.auteur.prenom} ${comment.auteur.nom}`} />
        ) : (
          <AvatarInitials user={comment.auteur} />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.author}>
            {comment?.auteur?.prenom} {comment?.auteur?.nom}
            <span className={styles.date}> • {formattedDate}</span>
          </div>

          {canEditOrDelete && (
            <div className={styles.actions}>
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} title="Modifier">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} title="Supprimer">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleUpdate} disabled={loading} title="Enregistrer">
                    <FontAwesomeIcon icon={faSave} />
                  </button>
                  <button onClick={() => setIsEditing(false)} title="Annuler">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!isEditing ? (
          <div className={styles.content}>{comment.contenu}</div>
        ) : (
          <textarea
            className={styles.editTextarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
        )}

        <div className={styles.footer}>
          <button
            className={`${styles.iconButton} ${isLiked ? styles.active : ''}`}
            onClick={handleLikeClick}
            disabled={loading}
            title="J'aime"
          >
            <FontAwesomeIcon icon={faHeart} />
            <span>{likeCount}</span>
          </button>

          <button
            className={`${styles.iconButton} ${isDisliked ? styles.active : ''}`}
            onClick={handleDislikeClick}
            disabled={loading}
            title="Je n'aime pas"
          >
            <FontAwesomeIcon icon={faThumbsDown} />
            <span>{dislikeCount}</span>
          </button>

          <button className={styles.iconButton} onClick={() => setShowReplyForm((s) => !s)} title="Répondre">
            <FontAwesomeIcon icon={faReply} />
          </button>
        </div>

        {showReplyForm && (
          <div className={styles.replyForm}>
            <CommentForm postId={postId} parentId={commentId} onCommentAdded={(c) => onUpdateComment?.({ ...comment, replies: [c, ...(comment.replies || [])] })} onCancel={() => setShowReplyForm(false)} />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Supprimer ce commentaire ?"
          message="Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
};

export default CommentItem;
