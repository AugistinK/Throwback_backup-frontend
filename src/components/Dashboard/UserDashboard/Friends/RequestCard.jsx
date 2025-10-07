// src/components/Dashboard/UserDashboard/Friends/RequestCard.jsx
import React from 'react';
import { UserCheck, UserX, Music } from 'lucide-react';
import styles from './Friends.module.css';

const RequestCard = ({ request, onAccept, onReject }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={styles.requestCard}>
      <div className={styles.requestLeft}>
        <div className={styles.avatar}>
          {request.avatar ? (
            <img src={request.avatar} alt={request.name} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarPlaceholder}>{getInitials(request.name)}</div>
          )}
        </div>
      </div>
      
      <div className={styles.requestInfo}>
        <div className={styles.requestHeader}>
          <div>
            <h3 className={styles.cardName}>{request.name}</h3>
            <p className={styles.cardUsername}>{request.username}</p>
          </div>
          <span className={styles.requestTime}>{request.date}</span>
        </div>
        
        <div className={styles.cardInfo}>
          <span className={styles.infoItem}>
            📍 {request.location}
          </span>
          <span className={styles.infoItem}>
            👥 {request.mutualFriends} mutual friends
          </span>
        </div>

        {request.favoriteGenres && request.favoriteGenres.length > 0 && (
          <div className={styles.musicTags}>
            <Music size={14} />
            {request.favoriteGenres.map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.requestActions}>
        <button 
          className={styles.acceptButton}
          onClick={() => onAccept(request.id)}
        >
          <UserCheck size={18} />
          Accept
        </button>
        <button 
          className={styles.rejectButton}
          onClick={() => onReject(request.id)}
        >
          <UserX size={18} />
          Decline
        </button>
      </div>
    </div>
  );
};

export default RequestCard;