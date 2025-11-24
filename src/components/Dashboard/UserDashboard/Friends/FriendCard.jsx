import React from 'react';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMessage,
  faUser,
  faMusic
} from '@fortawesome/free-solid-svg-icons';

const FriendCard = ({ friend, onRemove, onMessage, onViewProfile }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {friend.avatar ? (
              <img
                src={friend.avatar}
                alt={friend.name}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(friend.name)}
              </div>
            )}
            <span
              className={styles.statusDot}
              style={{
                backgroundColor:
                  friend.status === 'online' ? '#10b981' : '#9ca3af'
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{friend.name}</h3>
        

        <div className={styles.cardInfo}>
          <span className={styles.infoItem}>
            📍 {friend.location}
          </span>
          <span className={styles.infoItem}>
            👥 {friend.mutualFriends} mutual
          </span>
        </div>

        {friend.status === 'online' ? (
          <span className={styles.onlineStatus}>🟢 {friend.lastActive}</span>
        ) : (
          <span className={styles.offlineStatus}>⚫ {friend.lastActive}</span>
        )}

        {friend.favoriteGenres && friend.favoriteGenres.length > 0 && (
          <div className={styles.musicTags}>
            <FontAwesomeIcon icon={faMusic} style={{ fontSize: 14 }} />
            {friend.favoriteGenres.map((genre, index) => (
              <span key={index} className={styles.genreTag}>
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.messageButton}
          onClick={() => onMessage(friend)}
        >
          <FontAwesomeIcon icon={faMessage} style={{ fontSize: 16 }} />
          Message
        </button>
        <button
          className={styles.profileButton}
          onClick={() => onViewProfile(friend.id)}
        >
          <FontAwesomeIcon icon={faUser} style={{ fontSize: 16 }} />
          Profile
        </button>
      </div>
    </div>
  );
};

export default FriendCard;
