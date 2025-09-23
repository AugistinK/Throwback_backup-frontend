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

  // Formatage de la date
  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
      } else {
        return commentDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  // Déterminer le contexte (vidéo ou post)
  const getContext = () => {
    if (comment.video_id) {
      return {
        type: 'video',
        title: comment.video_id.titre,
        artist: comment.video_id.artiste,
        icon: 'fas fa-play-circle'
      };
    } else if (comment.post_id) {
      return {
        type: 'post',
        title: comment.post_id.contenu?.substring(0, 50) + '...',
        icon: 'fas fa-file-alt'
      };
    } else {
      return {
        type: 'memory',
        title: 'Souvenir partagé',
        icon: 'fas fa-heart'
      };
    }
  };

  // Obtenir le statut avec style
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

  // Obtenir les informations de l'auteur
  const getAuthorInfo = () => {
    if (!comment.auteur) {
      return {
        name: 'Utilisateur supprimé',
        email: '',
        avatar: '/images/default-avatar.jpg',
        isActive: false
      };
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
      {/* Checkbox de sélection */}
      <div className={styles.checkboxColumn}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className={styles.checkbox}
        />
      </div>

      {/* Contenu du commentaire */}
      <div className={styles.contentColumn}>
        <div className={styles.commentContent}>
          <p className={showFullContent ? '' : styles.truncated}>
            {comment.contenu}
          </p>
          {comment.contenu.length > 150 && (
            <button
              className={styles.toggleContent}
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        {/* Métadonnées du commentaire */}
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
          {comment.signale_par?.length > 0 && (
            <span className={`${styles.metaItem} ${styles.reported}`}>
              <i className="fas fa-flag"></i>
              {comment.signale_par.length} signalement{comment.signale_par.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Auteur */}
      <div className={styles.authorColumn}>
        <div className={styles.authorInfo}>
          <img
            src={author.avatar}
            alt={author.name}
            className={styles.authorAvatar}
            onError={(e) => {
              e.target.src = '/images/default-avatar.jpg';
            }}
          />
          <div className={styles.authorDetails}>
            <div className={`${styles.authorName} ${!author.isActive ? styles.inactiveUser : ''}`}>
              {author.name}
            </div>
            <div className={styles.authorEmail}>{author.email}</div>
          </div>
        </div>
      </div>

      {/* Contexte */}
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
            {context.artist && (
              <div className={styles.contextArtist}>{context.artist}</div>
            )}
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className={styles.statusColumn}>
        {getStatusBadge()}
      </div>

      {/* Date */}
      <div className={styles.dateColumn}>
        <div className={styles.dateInfo}>
          <div className={styles.dateRelative}>
            {formatDate(comment.creation_date)}
          </div>
          <div className={styles.dateAbsolute}>
            {new Date(comment.creation_date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsColumn}>
        <div className={styles.actionButtons}>
          {/* Bouton de modération */}
          <button
            className={styles.actionBtn}
            onClick={() => setShowModerationModal(true)}
            title="Modérer ce commentaire"
          >
            <i className="fas fa-gavel"></i>
          </button>

          {/* Bouton de réponse */}
          <button
            className={styles.actionBtn}
            onClick={() => setShowReplyModal(true)}
            title="Répondre à ce commentaire"
          >
            <i className="fas fa-reply"></i>
          </button>

          {/* Actions rapides */}
          {comment.statut !== 'ACTIF' && (
            <button
              className={`${styles.actionBtn} ${styles.approveBtn}`}
              onClick={() => onModerate(comment._id, 'approve')}
              title="Approuver"
            >
              <i className="fas fa-check"></i>
            </button>
          )}

          {comment.statut !== 'SUPPRIME' && (
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onModerate(comment._id, 'delete')}
              title="Supprimer"
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
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