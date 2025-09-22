// components/Dashboard/AdminDashboard/Comments/CommentCard.jsx
import React, { useState } from 'react';
import styles from './CommentCard.module.css';
import ModerationModal from './ModerationModal';
import ReplyModal from './ReplyModal';

const CommentCard = ({ 
  comment, 
  isSelected, 
  onSelect, 
  onModerate, 
  onReply 
}) => {
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const safeContent = typeof comment.contenu === 'string' ? comment.contenu : '';
  const creationDate = comment.creation_date || comment.createdAt || new Date().toISOString();

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    if (Number.isNaN(diffInHours)) return '';
    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    return commentDate.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  const getContext = () => {
    if (comment.video_id) {
      return { type: 'video', title: comment.video_id.titre, artist: comment.video_id.artiste, icon: 'fas fa-play-circle' };
    } else if (comment.post_id) {
      return { type: 'post', title: (comment.post_id.contenu || '').substring(0, 50) + '...', icon: 'fas fa-file-alt' };
    } else {
      return { type: 'memory', title: 'Souvenir partagé', icon: 'fas fa-heart' };
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      ACTIF: { className: styles.statusActive, icon: 'fas fa-check-circle', label: 'Actif' },
      MODERE: { className: styles.statusModerated, icon: 'fas fa-exclamation-triangle', label: 'Modéré' },
      SUPPRIME: { className: styles.statusDeleted, icon: 'fas fa-trash', label: 'Supprimé' },
      SIGNALE: { className: styles.statusReported, icon: 'fas fa-flag', label: 'Signalé' }
    };
    const config = statusConfig[comment.statut] || statusConfig.ACTIF;
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        <i className={config.icon}></i>
        {config.label}
      </span>
    );
  };

  const getAuthorInfo = () => {
    if (!comment.auteur) {
      return { name: 'Utilisateur supprimé', email: '', avatar: '/images/default-avatar.jpg', isActive: false };
    }
    return {
      name: `${comment.auteur.prenom || ''} ${comment.auteur.nom || ''}`.trim() || 'Utilisateur',
      email: comment.auteur.email || '',
      avatar: comment.auteur.photo_profil || '/images/default-avatar.jpg',
      isActive: comment.auteur.statut_compte === 'ACTIF'
    };
  };

  const context = getContext();
  const author = getAuthorInfo();

  return (
    <div className={`${styles.commentCard} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.checkboxColumn}>
        <input type="checkbox" checked={isSelected} onChange={onSelect} className={styles.checkbox} />
      </div>

      <div className={styles.contentColumn}>
        <div className={styles.commentContent}>
          <p className={showFullContent ? '' : styles.truncated}>
            {safeContent || '—'}
          </p>
          {safeContent.length > 150 && (
            <button className={styles.toggleContent} onClick={() => setShowFullContent(!showFullContent)}>
              {showFullContent ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        <div className={styles.commentMeta}>
          <span className={styles.metaItem}>
            <i className="fas fa-thumbs-up"></i>
            {comment.likes || 0} likes
          </span>
          <span className={styles.metaItem}>
            <i className="fas fa-thumbs-down"></i>
            {comment.dislikes || 0} dislikes
          </span>
          {comment.parent_comment && (
            <span className={styles.metaItem}>
              <i className="fas fa-reply"></i>
              Réponse
            </span>
          )}
          {Array.isArray(comment.signale_par) && comment.signale_par.length > 0 && (
            <span className={`${styles.metaItem} ${styles.reported}`}>
              <i className="fas fa-flag"></i>
              {comment.signale_par.length} signalement{comment.signale_par.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className={styles.authorColumn}>
        <div className={styles.authorInfo}>
          <img
            src={author.avatar}
            alt={author.name}
            className={styles.authorAvatar}
            onError={(e) => { e.currentTarget.src = '/images/default-avatar.jpg'; }}
          />
          <div className={styles.authorDetails}>
            <div className={`${styles.authorName} ${!author.isActive ? styles.inactiveUser : ''}`}>
              {author.name}
            </div>
            <div className={styles.authorEmail}>{author.email}</div>
          </div>
        </div>
      </div>

      <div className={styles.contextColumn}>
        <div className={styles.contextInfo}>
          <i className={`${context.icon} ${styles.contextIcon}`}></i>
          <div className={styles.contextDetails}>
            <div className={styles.contextType}>
              {context.type === 'video' ? 'Vidéo' : context.type === 'post' ? 'Post' : 'Souvenir'}
            </div>
            <div className={styles.contextTitle} title={context.title}>
              {context.title}
            </div>
            {context.artist && <div className={styles.contextArtist}>{context.artist}</div>}
          </div>
        </div>
      </div>

      <div className={styles.statusColumn}>{getStatusBadge()}</div>

      <div className={styles.dateColumn}>
        <div className={styles.dateInfo}>
          <div className={styles.dateRelative}>{formatDate(creationDate)}</div>
          <div className={styles.dateAbsolute}>
            {new Date(creationDate).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      <div className={styles.actionsColumn}>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} onClick={() => setShowModerationModal(true)} title="Modérer ce commentaire">
            <i className="fas fa-gavel"></i>
          </button>

          <button className={styles.actionBtn} onClick={() => setShowReplyModal(true)} title="Répondre à ce commentaire">
            <i className="fas fa-reply"></i>
          </button>

          {comment.statut !== 'ACTIF' && (
            <button className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => onModerate(comment._id, 'approve')} title="Approuver">
              <i className="fas fa-check"></i>
            </button>
          )}

          {comment.statut !== 'SUPPRIME' && (
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onModerate(comment._id, 'delete')} title="Supprimer">
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      {showModerationModal && (
        <ModerationModal
          comment={comment}
          onModerate={(action, reason) => {
            onModerate(comment._id, action, reason);
            setShowModerationModal(false);
          }}
          onClose={() => setShowModerationModal(false)}
        />
      )}

      {showReplyModal && (
        <ReplyModal
          comment={comment}
          onReply={(content) => {
            onReply(comment._id, content);
            setShowReplyModal(false);
          }}
          onClose={() => setShowReplyModal(false)}
        />
      )}
    </div>
  );
};

export default CommentCard;
