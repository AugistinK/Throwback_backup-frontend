// src/components/Dashboard/UserDashboard/Chat/MessageItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCheckDouble,
  faEllipsisVertical,
  faCopy,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const MessageItem = ({
  message,
  isOwn,
  showAvatar,
  participant,
  currentUser,
  isGroup
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitialsFromUser = (user) => {
    if (!user) return '';
    const first = user.prenom || user.firstName || user.name || '';
    const last = user.nom || user.lastName || '';
    const text = `${first} ${last}`.trim();
    if (!text) return '';
    return text
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  };

  const senderForAvatar = isGroup
    ? message.sender
    : isOwn
    ? currentUser
    : participant;

  const handleCopyMessage = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowMenu(false);
  };

  const senderDisplayName = (() => {
    const u = message.sender;
    if (!u) return '';
    const first = u.prenom || u.firstName || u.name || '';
    const last = u.nom || u.lastName || '';
    return `${first} ${last}`.trim() || first || last;
  })();

  return (
    <div
      className={`${styles.messageWrapper} ${
        isOwn ? styles.messageOwn : styles.messageOther
      }`}
    >
      {!isOwn && showAvatar && (
        <div className={styles.messageAvatar}>
          {senderForAvatar?.photo_profil ? (
            <img
              src={senderForAvatar.photo_profil}
              alt={senderDisplayName}
            />
          ) : (
            <div className={styles.messageAvatarPlaceholder}>
              {getInitialsFromUser(senderForAvatar)}
            </div>
          )}
        </div>
      )}

      <div
        className={`${styles.messageBubble} ${
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
        } ${message.tempId ? styles.messageSending : ''}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(true);
        }}
      >
        {isGroup && !isOwn && senderDisplayName && (
          <div className={styles.messageAuthor}>{senderDisplayName}</div>
        )}

        {message.type === 'text' && (
          <p className={styles.messageContent}>{message.content}</p>
        )}

        {message.type === 'image' && (
          <div className={styles.messageImage}>
            <img src={message.content} alt="Shared" />
            {message.caption && (
              <p className={styles.imageCaption}>{message.caption}</p>
            )}
          </div>
        )}

        {message.type === 'audio' && (
          <div className={styles.messageAudio}>
            <audio controls src={message.content}></audio>
          </div>
        )}

        {message.type === 'video' && (
          <div className={styles.messageVideo}>
            <video controls src={message.content}></video>
          </div>
        )}

        <div className={styles.messageInfo}>
          <span className={styles.messageTime}>
            {formatTime(message.created_date)}
          </span>
          {isOwn && (
            <span className={styles.messageStatus}>
              <FontAwesomeIcon
                icon={message.read ? faCheckDouble : faCheck}
                className={
                  message.read ? styles.readIcon : styles.sentIcon
                }
              />
            </span>
          )}
        </div>

        <button
          className={styles.messageMenuButton}
          onClick={() => setShowMenu(!showMenu)}
        >
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>

        {showMenu && (
          <>
            <div
              className={styles.menuOverlay}
              onClick={() => setShowMenu(false)}
            />
            <div
              className={`${styles.messageDropdown} ${
                isOwn ? styles.messageDropdownOwn : ''
              }`}
            >
              {/* Reply & Forward retirés – il reste seulement Copy + Delete */}
              <button
                className={styles.dropdownItem}
                onClick={handleCopyMessage}
              >
                <FontAwesomeIcon icon={faCopy} />
                Copy
              </button>

              {isOwn && (
                <>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
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

export default MessageItem;
