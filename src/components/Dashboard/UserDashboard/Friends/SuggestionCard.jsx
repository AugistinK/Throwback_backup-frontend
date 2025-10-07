// src/components/Dashboard/UserDashboard/Friends/SuggestionCard.jsx
import React from 'react';
import { UserPlus, Music, Sparkles } from 'lucide-react';
import styles from './Friends.module.css';

const SuggestionCard = ({ suggestion, onAdd }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={styles.card}>
      <div className={styles.suggestionBadge}>
        <Sparkles size={14} />
        Suggested
      </div>

      <div className={styles.avatarWrapper}>
        <div className={styles.avatar}>
          {suggestion.avatar ? (
            <img src={suggestion.avatar} alt={suggestion.name} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarPlaceholder}>{getInitials(suggestion.name)}</div>
          )}
        </div>
      </div>
      
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{suggestion.name}</h3>
        <p className={styles.cardUsername}>{suggestion.username}</p>
        
        <div className={styles.cardInfo}>
          <span className={styles.infoItem}>
            📍 {suggestion.location}
          </span>
          <span className={styles.infoItem}>
            👥 {suggestion.mutualFriends} mutual
          </span>
        </div>

        <div className={styles.reasonBadge}>
          💡 {suggestion.reason}
        </div>

        {suggestion.favoriteGenres && suggestion.favoriteGenres.length > 0 && (
          <div className={styles.musicTags}>
            <Music size={14} />
            {suggestion.favoriteGenres.map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <button 
          className={styles.addButton}
          onClick={() => onAdd(suggestion.id)}
        >
          <UserPlus size={18} />
          Add Friend
        </button>
      </div>
    </div>
  );
};

export default SuggestionCard;