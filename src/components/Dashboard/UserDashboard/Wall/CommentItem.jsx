// components/Dashboard/UserDashboard/Wall/CommentItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faReply,
  faEdit,
  faTrash,
  faThumbsDown,
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

  const commentId = comment._id || comment.id;

  // ---------- Helpers robustes pour comparer les IDs ----------
  const getUserId = (u) => {
    if (!u) return null;
    return u.id || u._id || u.userId || u.uid || null;
  };

  const getAuthorObj = () =>
    comment?.user ||
    comment?.auteur ||
    comment?.author ||
    comment?.createdBy ||
    null;

  const getAuthorId = () => {
    const fromObj = getUserId(getAuthorObj());
    return (
      fromObj ||
      comment?.userId ||
      comment?.auteurId ||
      comment?.authorId ||
      comment?.createdById ||
      null
    );
  };

  const isCommentAuthor = () => {
    const me = getUserId(user);
    const author = getAuthorId();
    if (!me || !author) return false;
    return String(me) === String(author);
  };

  // ---------- Permissions : auteur uniquement ----------
  const canModify = isCommentAuthor(); // Edit
  const canDelete = isCommentAuthor(); // Delete

  // ---------- Like / Dislike ----------
  const isLiked = !!comment.userInteraction?.liked;
  const isDisliked = !!comment.userInteraction?.disliked;
  const likeCount = comment.likes ?? comment.likesCount ?? 0;
  const dislikeCount = comment.dislikes ?? comment.dislikesCount ?? 0;

  const withTimeAgo = (dateish) => {
    try {
      return formatDistanceToNow(new Date(dateish), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  const creationDate = comment.creation_date || comment.createdAt || comment.created_at || Date.now();
  const formattedDate = withTimeAgo(creationDate);

  const handleLikeClick = async () => {
    if (loading || !commentId) return;
    // Optimiste
    const optimistic = {
      ...comment,
      userInteraction: { ...(comment.userInteraction || {}), liked: !isLiked, disliked: false },
      likes: isLiked ? likeCount - 1 : likeCount + 1,
      dislikes: isDisliked ? dislikeCount - 1 : dislikeCount
    };
    onUpdateComment?.(optimistic);

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post(`/api/comments/${commentId}/like`);
      if (data?.data) onUpdateComment?.({ ...comment, ...data.data });
    } catch (e) {
      onUpdateComment?.(comment); // rollback
      setError('Unable to like this comment. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDislikeClick = async () => {
    if (loading || !commentId) return;
    // Optimiste
    const optimistic = {
      ...comment,
      userInteraction: { ...(comment.userInteraction || {}), disliked: !isDisliked, liked: false },
      dislikes: isDisliked ? dislikeCount - 1 : dislikeCount + 1,
      likes: isLiked ? likeCount - 1 : likeCount
    };
    onUpdateComment?.(optimistic);

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post(`/api/comments/${commentId}/dislike`);
      if (data?.data) onUpdateComment?.({ ...comment, ...data.data });
    } catch (e) {
      onUpdateComment?.(comment); // rollback
      setError('Unable to dislike this comment. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Réponses ----------
  const loadReplies = async () => {
    if (!commentId) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/api/comments/${commentId}/replies`);
      const list = data?.data || data || [];
      setReplies(Array.isArray(list) ? list : []);
      setShowReplies(true);
    } catch (e) {
      console.error(e);
      setError('Unable to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = (newReply) => {
    setReplies((prev) => [newReply, ...prev]);
    setShowReplyForm(false);
    setShowReplies(true);
    onUpdateComment?.({
      ...comment,
      totalReplies: (comment.totalReplies || 0) + 1,
      hasMoreReplies: true
    });
  };

  // ---------- Edit ----------
  const startEdit = () => {
    setIsEditing(true);
    setEditContent(comment.contenu);
    setShowDropdown(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.contenu);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !commentId) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.put(`/api/comments/${commentId}`, { contenu: editContent });
      if (data) {
        onUpdateComment?.({ ...comment, contenu: editContent, modified_date: new Date().toISOString() });
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
      setError('Unable to edit this comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete ----------
  const requestDelete = () => {
    setShowDropdown(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!commentId) return;
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/api/comments/${commentId}`);
      onDeleteComment?.(commentId);
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
      setError('Unable to delete this comment. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        {getAuthorObj()?.photo_profil ? (
          <img
            src={getAuthorObj().photo_profil}
            alt={`${getAuthorObj()?.prenom || ''} ${getAuthorObj()?.nom || ''}`}
            className={styles.userAvatar}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const sib = e.currentTarget.nextElementSibling;
              if (sib) sib.style.display = 'flex';
            }}
          />
        ) : (
          <AvatarInitials user={getAuthorObj()} className={styles.userAvatar} />
        )}

        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <span className={styles.userName}>
              {(getAuthorObj()?.prenom || '') + ' ' + (getAuthorObj()?.nom || '')}
            </span>
            <span className={styles.commentDate}>{formattedDate}</span>
          </div>

          {!isEditing ? (
            <div className={styles.commentText}>{comment.contenu}</div>
          ) : (
            <>
              <textarea
                className={styles.editInput}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className={styles.editButtons}>
                <button className={styles.cancelEditButton} onClick={cancelEdit}>
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Cancel</span>
                </button>
                <button
                  className={styles.saveEditButton}
                  onClick={saveEdit}
                  disabled={loading || !editContent.trim()}
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>Save</span>
                </button>
              </div>
            </>
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
              onClick={() => setShowReplyForm((s) => !s)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>Reply</span>
            </button>

            {comment.totalReplies > 0 && !showReplies && (
              <button className={styles.actionButton} onClick={loadReplies} disabled={loading}>
                <span>View {comment.totalReplies} replies</span>
              </button>
            )}

            {showReplies && comment.totalReplies > 0 && (
              <button className={styles.actionButton} onClick={() => setShowReplies(false)}>
                <span>Hide replies</span>
              </button>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        {user && (
          <div className={styles.dropdownContainer}>
            <button className={styles.moreButton} onClick={() => setShowDropdown((s) => !s)}>
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                {/* Edit : auteur seulement */}
                {canModify && (
                  <button onClick={startEdit}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                )}

                {/* Delete : auteur seulement */}
                {canDelete && (
                  <button onClick={requestDelete}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                )}

                {/* 🚫 Report retiré comme demandé */}
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
          {replies.map((reply) => (
            <div key={reply._id || reply.id || `reply-${Math.random()}`} className={styles.replyItem}>
              {reply?.auteur?.photo_profil ? (
                <img
                  src={reply.auteur.photo_profil}
                  alt={`${reply.auteur?.prenom || ''} ${reply.auteur?.nom || ''}`}
                  className={styles.replyAvatar}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const sib = e.currentTarget.nextElementSibling;
                    if (sib) sib.style.display = 'flex';
                  }}
                />
              ) : (
                <AvatarInitials user={reply.auteur} size={24} className={styles.replyAvatar} />
              )}

              <div className={styles.replyContent}>
                <div className={styles.replyMeta}>
                  <span className={styles.replyUserName}>
                    {(reply?.auteur?.prenom || '') + ' ' + (reply?.auteur?.nom || '')}
                  </span>
                  <span className={styles.replyDate}>
                    {withTimeAgo(reply.creation_date || reply.createdAt || reply.created_at)}
                  </span>
                </div>

                <div className={styles.replyText}>{reply.contenu}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="Are you sure you want to delete this comment?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default CommentItem;
