// src/components/Dashboard/UserDashboard/Chat/ConversationItem.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble, faCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const ConversationItem = ({ conversation, isSelected, onSelect, isOnline }) => {
  const { participant, lastMessage, unreadCount } = conversation;

  const getInitials = (nom, prenom) => {
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    
    // Moins d'une minute
    if (diff < 60000) {
      return 'À l\'instant';
    }
    
    // Moins d'une heure
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min`;
    }
    
    // Aujourd'hui
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Cette semaine
    if (diff < 604800000) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days[messageDate.getDay()];
    }
    
    // Plus ancien
    return messageDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div 
      className={`${styles.conversationItem} ${isSelected ? styles.conversationSelected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.conversationAvatar}>
        {participant.photo_profil ? (
          <img 
            src={participant.photo_profil} 
            alt={`${participant.prenom} ${participant.nom}`}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {getInitials(participant.nom, participant.prenom)}
          </div>
        )}
        {isOnline && (
          <span className={styles.onlineIndicator}>
            <FontAwesomeIcon icon={faCircle} />
          </span>
        )}
      </div>

      <div className={styles.conversationContent}>
        <div className={styles.conversationTop}>
          <h3 className={styles.conversationName}>
            {`${participant.prenom} ${participant.nom}`}
          </h3>
          {lastMessage && (
            <span className={styles.conversationTime}>
              {formatTime(lastMessage.created_date)}
            </span>
          )}
        </div>

        <div className={styles.conversationBottom}>
          <div className={styles.lastMessage}>
            {lastMessage && (
              <>
                {lastMessage.sender._id !== participant._id && (
                  <span className={styles.messageStatus}>
                    <FontAwesomeIcon 
                      icon={lastMessage.read ? faCheckDouble : faCheck}
                      className={lastMessage.read ? styles.readIcon : styles.sentIcon}
                    />
                  </span>
                )}
                <span className={styles.messageText}>
                  {truncateMessage(lastMessage.content)}
                </span>
              </>
            )}
          </div>

          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;