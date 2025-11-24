import React from 'react';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUnlock,
  faUserLock,
  faUser
} from '@fortawesome/free-solid-svg-icons';

const BlockedFriendCard = ({ user, onUnblock, onViewProfile }) => {
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(user.name)}
              </div>
            )}
            <span
              className={styles.statusDot}
              style={{
                backgroundColor: '#6b7280' // gris = bloqué
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{user.name}</h3>
        

        <div className={styles.cardInfo}>
          <span className={styles.infoItem}>
            📍 {user.location || 'Unknown'}
          </span>
        </div>

        <span className={styles.offlineStatus}>
          <FontAwesomeIcon icon={faUserLock} style={{ fontSize: 14, marginRight: 4 }} />
          Blocked user
        </span>
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.messageButton}
          onClick={() => onUnblock(user.id)}
        >
          <FontAwesomeIcon icon={faUnlock} style={{ fontSize: 16 }} />
          Unblock
        </button>

        <button
          className={styles.profileButton}
          onClick={() => onViewProfile && onViewProfile(user.id)}
        >
          <FontAwesomeIcon icon={faUser} style={{ fontSize: 16 }} />
          Profile
        </button>
      </div>
    </div>
  );
};

export default BlockedFriendCard;
