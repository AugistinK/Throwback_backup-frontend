import React from 'react';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faUser,
  faEnvelope,
  faLocationDot,
  faUserGroup,
  faCircle,
  faMusic,
  faMessage,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

const FriendProfileModal = ({ friend, onClose, onMessage, onRemove }) => {
  if (!friend) return null;

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: 24 }} />
            Friend Profile
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.profileTop}>
            <div className={styles.profileAvatarWrap}>
              <div className={styles.avatar}>
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.name} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>{getInitials(friend.name)}</div>
                )}
                <span
                  className={styles.statusDot}
                  style={{ backgroundColor: friend.status === 'online' ? '#10b981' : '#9ca3af' }}
                  title={friend.status === 'online' ? 'Online' : 'Offline'}
                />
              </div>
            </div>

            <div className={styles.profileMain}>
              <h3 className={styles.cardName} style={{ fontSize: 22, marginBottom: 6 }}>
                {friend.name}
              </h3>
              <p className={styles.cardUsername} style={{ marginBottom: 10 }}>
                <FontAwesomeIcon icon={faEnvelope} /> {friend.username}
              </p>

              <div className={styles.cardInfo} style={{ gap: 12 }}>
                <span className={styles.infoItem}>
                  <FontAwesomeIcon icon={faLocationDot} /> {friend.location || 'Unknown'}
                </span>
                <span className={styles.infoItem}>
                  <FontAwesomeIcon icon={faUserGroup} /> {friend.mutualFriends || 0} mutual
                </span>
                <span className={styles.infoItem}>
                  <FontAwesomeIcon icon={faCircle} /> {friend.lastActive || 'Recently'}
                </span>
              </div>

              {Array.isArray(friend.favoriteGenres) && friend.favoriteGenres.length > 0 && (
                <div className={styles.musicTags} style={{ marginTop: 12 }}>
                  <FontAwesomeIcon icon={faMusic} style={{ fontSize: 14 }} />
                  {friend.favoriteGenres.map((g, i) => (
                    <span key={i} className={styles.genreTag}>{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {friend.bio && (
            <div className={styles.profileSection}>
              <h4 className={styles.sectionTitle}>About</h4>
              <p className={styles.profileBio}>{friend.bio}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.footerButton} onClick={onClose}>
            Close
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              className={styles.footerButtonPrimary}
              onClick={() => onMessage(friend)}
              title="Send Message"
            >
              <FontAwesomeIcon icon={faMessage} style={{ marginRight: 8 }} />
              Message
            </button>
            <button
              className={`${styles.footerButton} ${styles.dangerButton}`}
              onClick={() => onRemove(friend.id)}
              title="Unfriend"
            >
              <FontAwesomeIcon icon={faUserMinus} style={{ marginRight: 8 }} />
              Unfriend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfileModal;
