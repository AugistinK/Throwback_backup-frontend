// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, conversation, isOnline, onBack }) => {
  const isGroup = !!conversation?.isGroup;

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

  const groupName =
    conversation?.groupName || conversation?.name || conversation?.title || 'Group';

  const userName =
    `${participant?.prenom || ''} ${participant?.nom || ''}`.trim() ||
    participant?.username ||
    'Friend';

  const title = isGroup ? groupName : userName;

  const subtitle = isGroup
    ? conversation?.members?.length
      ? `${conversation.members.length} members`
      : 'Group chat'
    : isOnline
    ? 'Online'
    : 'Offline';

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )}

        <div className={styles.chatHeaderAvatar}>
          {isGroup ? (
            <div className={styles.headerAvatarPlaceholder}>
              {getInitials(groupName)}
            </div>
          ) : participant?.photo_profil ? (
            <img
              src={participant.photo_profil}
              alt={userName}
              className={styles.headerAvatarImage}
            />
          ) : (
            <div className={styles.headerAvatarPlaceholder}>
              {getInitials(userName)}
            </div>
          )}

          {!isGroup && isOnline && (
            <span className={styles.headerOnlineIndicator}>
              <FontAwesomeIcon icon={faCircle} />
            </span>
          )}
        </div>

        <div className={styles.chatHeaderInfo}>
          <h3 className={styles.chatHeaderName}>{title}</h3>
          <p className={styles.chatHeaderStatus}>{subtitle}</p>
        </div>
      </div>

      {/* Zone droite gardée pour le layout, mais sans "more options" */}
      <div className={styles.chatHeaderActions} />
    </div>
  );
};

export default ChatHeader;
