// components/Dashboard/AdminDashboard/Comments/CommentCard.jsx
import React, { useState } from 'react';
import styles from './CommentCard.module.css';
import ModerationModal from './ModerationModal';
import ReplyModal from './ReplyModal';

const toAbsoluteUrl = (url) => {
  if (!url) return '/images/default-avatar.jpg';
  if (url.startsWith('http')) return url;
  const base = process.env.REACT_APP_API_URL || 'https://throwback-backup-backend.onrender.com';
  return url.startsWith('/') ? base + url : `${base}/${url}`;
};

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

  if (!comment) return null;

  const author = {
    name: `${comment?.auteur?.prenom || ''} ${comment?.auteur?.nom || ''}`.trim() || comment?.auteur?.username || 'Utilisateur',
    email: comment?.auteur?.email || '',
    avatar: comment?.auteur?.photo_profil || comment?.auteur?.avatar || ''
  };

  const getContext = () => {
    if (comment?.video_id) {
      return {
        type: 'video',
        title: comment?.video_id?.titre || comment?.video_id?.title || 'Vidéo',
        artist: comment?.video_id?.artiste || comment?.video_id?.artist || '',
        icon: 'fas fa-play-circle'
      };
    } else if (comment?.post_id) {
      return {
        type: 'post',
        title: ((comment?.post_id?.contenu || comment?.post_id?.content || '') + '').substring(0, 50) + '…',
        icon: 'fas fa-file-alt'
      };
    } else if (comment?.podcast_id) {
      const p = comment.podcast_id;
      const title = p?.titre || p?.title || p?.name || p?.titre_episode || 'Podcast';
      return {
        type: 'podcast',
        title,
        artist: p?.auteur || p?.host || '',
        icon: 'fas fa-podcast'
      };
    } else {
      return { type: 'memory', title: 'Souvenir partagé', icon: 'fas fa-heart' };
    }
  };

  const context = getContext();

  const getStatusBadge = () => {
    const status = comment?.statut || comment?.status || 'ACTIF';
    const conf = {
      'ACTIF': { cls: styles.badgeActive, label: 'ACTIF', dot: styles.dotGreen },
      'EN_ATTENTE': { cls: styles.badgePending, label: 'EN ATTENTE', dot: styles.dotAmber },
      'SUPPRIME': { cls: styles.badgeRemoved, label: 'SUPPRIMÉ', dot: styles.dotRed },
    };
    const s = conf[status] || conf['ACTIF'];
    return (
      <div className={`${styles.statusBadge} ${s.cls}`}>
        <span className={s.dot}></span>
        {s.label}
      </div>
    );
  };

  const content = (comment?.contenu || comment?.content || '').trim();

  return (
    <div className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.left}>
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={(e) => onSelect?.(comment?._id, e.target.checked)}
        />
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.author}>
            <img
              src={toAbsoluteUrl(author.avatar)}
              alt={author.name}
              className={styles.authorAvatar}
              onError={(e) => { e.currentTarget.src = '/images/default-avatar.jpg'; }}
            />
            <div className={styles.authorInfo}>
              <div className={styles.authorName}>{author.name}</div>
              {author.email ? <div className={styles.authorEmail}>{author.email}</div> : null}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className={styles.content}>
          {showFullContent || content.length <= 200 ? (
            <p>{content}</p>
          ) : (
            <p>
              {content.substring(0, 200)}…
              <button className={styles.moreBtn} onClick={() => setShowFullContent(true)}>voir plus</button>
            </p>
          )}
        </div>

        <div className={styles.context}>
          <i className={`${context.icon} ${styles.contextIcon}`}></i>
          <div className={styles.contextInfo}>
            <div className={styles.contextType}>
              {context.type === 'video' ? 'POST • VIDÉO' :
               context.type === 'post' ? 'POST' :
               context.type === 'podcast' ? 'PODCAST' : 'SOUVENIR'}
            </div>
            <div className={styles.contextTitle}>
              {context.title}{context.artist ? ` • ${context.artist}` : ''}
            </div>
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}><i className="far fa-thumbs-up"></i> {comment?.likes || 0} likes</div>
          <div className={styles.metaItem}><i className="far fa-thumbs-down"></i> {comment?.dislikes || 0} dislikes</div>
          <div className={styles.metaItem}><i className="far fa-flag"></i> {(comment?.signale_par?.length) || 0} signalements</div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} title="Répondre" onClick={() => setShowReplyModal(true)}>
            <i className="fas fa-reply"></i>
          </button>
          <button className={styles.actionBtn} title="Modérer" onClick={() => setShowModerationModal(true)}>
            <i className="fas fa-shield-alt"></i>
          </button>
        </div>
      </div>

      {showModerationModal && (
        <ModerationModal
          comment={comment}
          onModerate={(payload) => {
            onModerate?.(comment?._id, payload);
            setShowModerationModal(false);
          }}
          onClose={() => setShowModerationModal(false)}
        />
      )}

      {showReplyModal && (
        <ReplyModal
          comment={comment}
          onReply={(text) => {
            onReply?.(comment?._id, text);
            setShowReplyModal(false);
          }}
          onClose={() => setShowReplyModal(false)}
        />
      )}
    </div>
  );
};

export default CommentCard;
