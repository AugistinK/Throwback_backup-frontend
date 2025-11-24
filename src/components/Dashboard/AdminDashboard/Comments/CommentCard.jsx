// components/Dashboard/AdminDashboard/Comments/CommentCard.jsx
import React, { useState } from 'react';
import styles from './CommentCard.module.css';

// Helper to build absolute URL for profile pictures
const toAbsoluteUrl = (url) => {
  if (!url) return '/images/default-avatar.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const base = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedBase}${normalizedUrl}`;
};

const CommentCard = ({ comment }) => {
  const [showFullContent, setShowFullContent] = useState(false);

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return commentDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  // Context (video, post, memory)
  const getContext = () => {
    if (comment.video_id) {
      return {
        type: 'video',
        title: comment.video_id.titre,
        artist: comment.video_id.artiste,
        icon: 'fas fa-play-circle'
      };
    } else if (comment.post_id) {
      const content = comment.post_id.contenu || '';
      return {
        type: 'post',
        title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        icon: 'fas fa-file-alt'
      };
    } else {
      return {
        type: 'memory',
        title: 'Shared memory',
        icon: 'fas fa-heart'
      };
    }
  };

  // Author info
  const getAuthorInfo = () => {
    if (!comment.auteur) {
      return {
        name: 'Deleted user',
        email: '',
        avatar: '/images/default-avatar.jpg',
        isActive: false
      };
    }

    const rawAvatar = comment.auteur.photo_profil;

    return {
      name: `${comment.auteur.prenom || ''} ${comment.auteur.nom || ''}`.trim() || 'User',
      email: comment.auteur.email || '',
      avatar: toAbsoluteUrl(rawAvatar),
      isActive: comment.auteur.statut_compte === 'ACTIF'
    };
  };

  const context = getContext();
  const author = getAuthorInfo();

  return (
    <div className={styles.commentCard}>
      {/* Comment content */}
      <div className={styles.contentColumn}>
        <div className={styles.commentContent}>
          <p className={showFullContent ? '' : styles.truncated}>
            {comment.contenu}
          </p>
          {comment.contenu && comment.contenu.length > 150 && (
            <button
              className={styles.toggleContent}
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        {/* Comment metadata */}
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
              Reply
            </span>
          )}
        </div>
      </div>

      {/* Author */}
      <div className={styles.authorColumn}>
        <div className={styles.authorInfo}>
          <img
            src={author.avatar}
            alt={author.name}
            className={styles.authorAvatar}
            onError={(e) => {
              e.currentTarget.src = '/images/default-avatar.jpg';
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

      {/* Context */}
      <div className={styles.contextColumn}>
        <div className={styles.contextInfo}>
          <i className={`${context.icon} ${styles.contextIcon}`}></i>
          <div className={styles.contextDetails}>
            <div className={styles.contextType}>
              {context.type === 'video' ? 'Video' : context.type === 'post' ? 'Post' : 'Memory'}
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

      {/* Date */}
      <div className={styles.dateColumn}>
        <div className={styles.dateInfo}>
          <div className={styles.dateRelative}>
            {formatDate(comment.creation_date)}
          </div>
          <div className={styles.dateAbsolute}>
            {new Date(comment.creation_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
