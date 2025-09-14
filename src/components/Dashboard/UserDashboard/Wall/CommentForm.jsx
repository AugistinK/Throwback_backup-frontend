// components/Dashboard/UserDashboard/Wall/CommentForm.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '././././contexts/AuthContext';
import api from '././././utils/api';
import AvatarInitials from './././Common/AvatarInitials';
import styles from './CommentForm.module.css';

const CommentForm = ({ postId, parentId, onCommentAdded, onCancel, onError }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      const msg = 'Veuillez entrer un commentaire';
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    // AUCUNE limite de caractères côté front
    try {
      setLoading(true);
      setLocalError(null);

      const res = await api.post(`/api/posts/${postId}/comments`, {
        contenu: content,
        parentId: parentId || null,
      });

      const newComment = res.data?.data || res.data;
      setContent('');
      onCommentAdded?.(newComment);
      if (parentId) onCancel?.();
    } catch (err) {
      console.error('Error submitting comment:', err);
      const msg = err.response?.data?.message || "Une erreur est survenue lors de l'envoi du commentaire";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <div className={styles.formContent}>
        {user?.photo_profil ? (
          <img
            src={user.photo_profil}
            alt={`${user.prenom} ${user.nom}`}
            className={styles.userAvatar}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : (
          <AvatarInitials user={user} className={styles.userAvatar} />
        )}

        <textarea
          placeholder="Écrivez un commentaire…"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (localError) setLocalError(null);
          }}
          className={styles.commentInput}
          disabled={loading}
          rows={2}
        />

        <button type="submit" className={styles.submitButton} disabled={loading || !content.trim()}>
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
        </button>
      </div>

      {localError && <div className={styles.errorMessage}>{localError}</div>}

      {parentId && onCancel && (
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          <FontAwesomeIcon icon={faTimes} />
          <span>Annuler</span>
        </button>
      )}
    </form>
  );
};

export default CommentForm;
