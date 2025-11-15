// src/components/Dashboard/UserDashboard/Chat/ConversationItem.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble, faCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const ConversationItem = ({ conversation, isSelected, onSelect, isOnline }) => {
  const { participant, lastMessage, unreadCount, isGroup } = conversation;

  const getInitials = (text) => {
    if (!text) return '';
    const parts = text.trim().split(' ');
    return parts
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;

    if (diff < 60000) {
      return 'Just now';
    }
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min`;
    }
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    if (diff < 604800000) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[messageDate.getDay()];
    }
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const displayName = isGroup
    ? conversation.name || 'Group'
    : `${participant?.prenom || ''} ${participant?.nom || ''}`.trim() ||
      'Friend';

  let lastMessagePreview = '';
  if (lastMessage) {
    if (isGroup && lastMessage.sender) {
      const senderName =
        lastMessage.sender.prenom ||
        lastMessage.sender.firstName ||
        lastMessage.sender.name ||
        '';
      lastMessagePreview = `${senderName}: ${lastMessage.content}`;
    } else {
      lastMessagePreview = lastMessage.content;
    }
  }

  const showStatusIcon =
    !isGroup && lastMessage && lastMessage.sender && participant;

  return (
    <div
      className={`${styles.conversationItem} ${
        isSelected ? styles.conversationSelected : ''
      }`}
      onClick={onSelect}
    >
      <div className={styles.conversationAvatar}>
        {isGroup ? (
          <div className={styles.avatarPlaceholder}>
            {getInitials(displayName || 'G')}
          </div>
        ) : participant?.photo_profil ? (
          <img
            src={participant.photo_profil}
            alt={displayName}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {getInitials(displayName)}
          </div>
        )}

        {!isGroup && isOnline && (
          <span className={styles.onlineIndicator}>
            <FontAwesomeIcon icon={faCircle} />
          </span>
        )}
      </div>

      <div className={styles.conversationContent}>
        <div className={styles.conversationTop}>
          <h3 className={styles.conversationName}>{displayName}</h3>
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
                {showStatusIcon &&
                  lastMessage.sender._id !== participant._id && (
                    <span className={styles.messageStatus}>
                      <FontAwesomeIcon
                        icon={lastMessage.read ? faCheckDouble : faCheck}
                        className={
                          lastMessage.read
                            ? styles.readIcon
                            : styles.sentIcon
                        }
                      />
                    </span>
                  )}
                <span className={styles.messageText}>
                  {truncateMessage(lastMessagePreview)}
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
