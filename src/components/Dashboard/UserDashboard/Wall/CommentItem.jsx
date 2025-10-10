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
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const { user } = useAuth();

  const getUserId = (u) => {
    if (!u) return null;
    return u.id || u._id || u.userId || null;
  };

  const commentAuthorId = () => {
    const c = comment?.user || comment?.auteur || comment?.author || comment?.createdBy || {};
    return getUserId(c) || comment?.userId || comment?.auteurId || comment?.authorId || null;
  };

  const currentUserId = getUserId(user);

  const isCommentAuthor = () => {
    const authorId = String(commentAuthorId() || '');
    const me = String(currentUserId || '');
    if (!authorId || !me) return false;
    return authorId === me;
  };

  const isUserAdmin = () => {
    // Selon ton modèle, adapte (role, roles, isAdmin, permissions...)
    const role = user?.role || user?.roles || [];
    if (Array.isArray(role)) return role.includes('admin') || role.includes('superadmin');
    return role === 'admin' || role === 'superadmin';
  };

  // ⬇️ Permissions calculées une seule fois
  const canModify = isCommentAuthor();
  // ✅ Correction: suppression uniquement par l'auteur
  const canDelete = isCommentAuthor();

  const toggleReplyForm = () => setShowReplyForm((s) => !s);
  const toggleDropdown = () => setShowDropdown((s) => !s);
  const toggleReplies = () => setShowReplies((s) => !s);

  const handleEdit = () => {
    setEditContent(comment.contenu);
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.contenu);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = { contenu: editContent };
      const { data } = await api.put(`/api/comments/${comment._id}`, payload);
      onUpdateComment?.(data);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert(errorMessages(e));
    }
  };

  const requestDelete = () => {
    setShowDropdown(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/comments/${comment._id}`);
      onDeleteComment?.(comment._id);
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
      alert(errorMessages(e));
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const { data } = await api.post(`/api/comments/${comment._id}/like`);
      onUpdateComment?.(data);
    } catch (e) {
      console.error(e);
      alert(errorMessages(e));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isDisliking) return;
    setIsDisliking(true);
    try {
      const { data } = await api.post(`/api/comments/${comment._id}/dislike`);
      onUpdateComment?.(data);
    } catch (e) {
      console.error(e);
      alert(errorMessages(e));
    } finally {
      setIsDisliking(false);
    }
  };

  const timeAgo = () => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt || comment.dateCreation || comment.created_at), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.avatar}>
        <AvatarInitials
          name={`${comment?.user?.prenom || comment?.auteur?.prenom || comment?.author?.firstName || ''} ${comment?.user?.nom || comment?.auteur?.nom || comment?.author?.lastName || ''}`.trim() || 'User'}
          imageUrl={comment?.user?.photo || comment?.auteur?.photo || comment?.author?.avatar}
          size={40}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.authorBlock}>
            <span className={styles.authorName}>
              {comment?.user?.pseudo || comment?.user?.nom || comment?.auteur?.nom || comment?.author?.username || 'Utilisateur'}
            </span>
            <span className={styles.dot}>•</span>
            <span className={styles.timeAgo}>{timeAgo()}</span>
          </div>

          <div className={styles.actionsRight}>
            <button className={styles.iconBtn} onClick={toggleDropdown} aria-label="Plus d'actions">
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                {canModify && (
                  <button className={styles.dropdownItem} onClick={handleEdit}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Éditer</span>
                  </button>
                )}

                {canDelete && (
                  <button className={styles.dropdownItemDanger} onClick={requestDelete}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                )}

                {!isCommentAuthor() && (
                  <button className={styles.dropdownItem} onClick={() => alert('Merci, le signalement a été pris en compte.')}>
                    <FontAwesomeIcon icon={faFlag} />
                    <span>Signaler</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          <p className={styles.commentText}>{comment.contenu}</p>
        ) : (
          <div className={styles.editContainer}>
            <textarea
              className={styles.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
            />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSaveEdit}>
                <FontAwesomeIcon icon={faSave} />
                <span>Enregistrer</span>
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelEdit}>
                <FontAwesomeIcon icon={faTimes} />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        )}

        <div className={styles.footerRow}>
          <div className={styles.reactions}>
            <button className={styles.iconBtn} onClick={handleLike} disabled={isLiking} aria-label="J'aime">
              <FontAwesomeIcon icon={faHeart} />
              <span>{comment.likesCount ?? comment.likes?.length ?? 0}</span>
            </button>
            <button className={styles.iconBtn} onClick={handleDislike} disabled={isDisliking} aria-label="Je n'aime pas">
              <FontAwesomeIcon icon={faThumbsDown} />
              <span>{comment.dislikesCount ?? comment.dislikes?.length ?? 0}</span>
            </button>
            <button className={styles.iconBtn} onClick={toggleReplyForm} aria-expanded={showReplyForm} aria-label="Répondre">
              <FontAwesomeIcon icon={faReply} />
              <span>Répondre</span>
            </button>
          </div>
          <div className={styles.repliesToggle}>
            {!!(comment.replies?.length) && (
              <button className={styles.linkBtn} onClick={toggleReplies}>
                {showReplies ? 'Masquer les réponses' : `Afficher les réponses (${comment.replies.length})`}
              </button>
            )}
          </div>
        </div>

        {showReplyForm && (
          <div className={styles.replyForm}>
            <CommentForm
              postId={postId}
              parentId={comment._id}
              onCancel={() => setShowReplyForm(false)}
              onSubmitted={(newReply) => {
                // mettre à jour localement si on veut un rendu optimiste
                onUpdateComment?.({ ...comment, replies: [newReply, ...(comment.replies || [])] });
                setShowReplyForm(false);
              }}
            />
          </div>
        )}

        {showReplies && !!comment.replies?.length && (
          <div className={styles.repliesList}>
            {comment.replies.map((rep) => (
              <div className={styles.replyItem} key={rep._id}>
                <div className={styles.replyAvatar}>
                  <AvatarInitials
                    name={`${rep?.user?.prenom || rep?.auteur?.prenom || rep?.author?.firstName || ''} ${rep?.user?.nom || rep?.auteur?.nom || rep?.author?.lastName || ''}`.trim() || 'User'}
                    imageUrl={rep?.user?.photo || rep?.auteur?.photo || rep?.author?.avatar}
                    size={30}
                  />
                </div>
                <div className={styles.replyContent}>
                  <div className={styles.replyHeader}>
                    <span className={styles.replyAuthor}>
                      {rep?.user?.pseudo || rep?.user?.nom || rep?.auteur?.nom || rep?.author?.username || 'Utilisateur'}
                    </span>
                    <span className={styles.dot}>•</span>
                    <span className={styles.timeAgo}>
                      {(() => {
                        try {
                          return formatDistanceToNow(new Date(rep.createdAt || rep.dateCreation || rep.created_at), {
                            addSuffix: true,
                            locale: fr
                          });
                        } catch {
                          return '';
                        }
                      })()}
                    </span>
                  </div>
                  <p className={styles.commentText}>{rep.contenu}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
