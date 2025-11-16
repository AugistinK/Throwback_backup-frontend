// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEllipsisVertical,
  faCircle,
  faUser,
  faBan,
  faTrash,
  faBellSlash
} from '@fortawesome/free-solid-svg-icons';
import { friendsAPI } from '../../../../utils/api';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, conversation, isOnline, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);

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

  const groupName = conversation?.name || 'Group';
  const userName =
    `${participant?.prenom || ''} ${participant?.nom || ''}`.trim() || 'Friend';

  const title = isGroup ? groupName : userName;
  const subtitle = isGroup
    ? conversation?.members?.length
      ? `${conversation.members.length} members`
      : 'Group chat'
    : isOnline
    ? 'Online'
    : 'Offline';

  const handleBlockUser = async () => {
    if (isGroup || !participant?._id) return;

    const confirmed = window.confirm(
      `Block ${userName}? They will no longer be able to chat with you.`
    );
    if (!confirmed) return;

    try {
      const res = await friendsAPI.blockUser(participant._id);
      alert(res.message || 'User has been blocked.');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block this user. Please try again.');
    } finally {
      setShowMenu(false);
    }
  };

  const handleClearConversation = async () => {
    if (isGroup || !participant?._id) return;

    const confirmed = window.confirm(
      `Delete your conversation history with ${userName}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await friendsAPI.clearChatHistory(participant._id);
      alert(res.message || 'Conversation history has been deleted.');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      alert('Failed to delete conversation history. Please try again.');
    } finally {
      setShowMenu(false);
    }
  };

  const handleToggleNotifications = () => {
    alert('Conversation notifications: feature coming soon.');
    setShowMenu(false);
  };

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        <button className={styles.backButton} onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

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

      <div className={styles.chatHeaderActions}>
        {/* Plus de recherche / appel audio / appel vidéo */}
        <button
          className={styles.headerActionButton}
          onClick={() => setShowMenu(!showMenu)}
          title="More options"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>

        {showMenu && (
          <>
            <div
              className={styles.menuOverlay}
              onClick={() => setShowMenu(false)}
            />
            <div className={styles.headerDropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => setShowMenu(false)}
              >
                <FontAwesomeIcon icon={faUser} />
                {isGroup ? 'View group details' : 'View profile'}
              </button>
              <button
                className={styles.dropdownItem}
                onClick={handleToggleNotifications}
              >
                <FontAwesomeIcon icon={faBellSlash} />
                Mute notifications
              </button>

              {!isGroup && (
                <>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                    onClick={handleBlockUser}
                  >
                    <FontAwesomeIcon icon={faBan} />
                    Block user
                  </button>
                  <button
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                    onClick={handleClearConversation}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete conversation
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
