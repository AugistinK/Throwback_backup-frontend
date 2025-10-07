// src/components/Dashboard/UserDashboard/Friends/FriendCard.jsx
import React, { useState } from 'react';
import { MoreVertical, MessageCircle, User, UserMinus, Music } from 'lucide-react';
import styles from './Friends.module.css';

const FriendCard = ({ friend, onRemove, onMessage, onViewProfile }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleMenuClick = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.name} className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>{getInitials(friend.name)}</div>
            )}
            <span 
              className={styles.statusDot}
              style={{
                backgroundColor: friend.status === 'online' ? '#10b981' : '#9ca3af'
              }}
            />
          </div>
        </div>
        
        <button 
          className={styles.menuButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical size={20} />
        </button>
        
        {showMenu && (
          <>
            <div 
              className={styles.menuOverlay} 
              onClick={() => setShowMenu(false)}
            />
            <div className={styles.dropdown}>
              <button 
                className={styles.dropdownItem}
                onClick={(e) => handleMenuClick(e, () => onViewProfile(friend.id))}
              >
                <User size={16} />
                View Profile
              </button>
              <button 
                className={styles.dropdownItem}
                onClick={(e) => handleMenuClick(e, () => onMessage(friend))}
              >
                <MessageCircle size={16} />
                Send Message
              </button>
              <div className={styles.dropdownDivider} />
              <button 
                className={`${styles.dropdownItem} ${styles.dangerItem}`}
                onClick={(e) => handleMenuClick(e, () => onRemove(friend.id))}
              >
                <UserMinus size={16} />
                Unfriend
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{friend.name}</h3>
        <p className={styles.cardUsername}>{friend.username}</p>
        
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
            <Music size={14} />
            {friend.favoriteGenres.map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <button 
          className={styles.messageButton}
          onClick={() => onMessage(friend)}
        >
          <MessageCircle size={16} />
          Message
        </button>
        <button 
          className={styles.profileButton}
          onClick={() => onViewProfile(friend.id)}
        >
          <User size={16} />
          Profile
        </button>
      </div>
    </div>
  );
};

export default FriendCard;