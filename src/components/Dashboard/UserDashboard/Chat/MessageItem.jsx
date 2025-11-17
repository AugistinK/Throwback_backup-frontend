// src/components/Dashboard/UserDashboard/Chat/MessageItem.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

// On réutilise le menu déjà fonctionnel
import MessageContextMenu from '../Friends/MessageContextMenu';

const MessageItem = ({
  message,
  isOwn,
  showAvatar,
  participant,
  currentUser,
  isGroup,
  // callbacks fournis par le parent pour utiliser les bons endpoints
  onEditMessage,
  onCopyMessage,
  onDeleteMessage
}) => {
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
    const first = user?.prenom || user?.firstName || user?.name || '';
    const last = user?.nom || user?.lastName || '';
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

  const senderDisplayName = (() => {
    const u = message.sender;
    if (!u) return '';
    const first = u.prenom || u.firstName || u.name || '';
    const last = u.nom || u.lastName || '';
    return `${first} ${last}`.trim() || first || last;
  })();

  // Fallback pour la copie si le parent ne fournit pas de handler
  const handleCopy = (msg) => {
    if (onCopyMessage) {
      onCopyMessage(msg);
    } else if (msg?.content) {
      navigator.clipboard.writeText(msg.content);
    }
  };

  const handleEdit = () => {
    if (onEditMessage) onEditMessage(message);
  };

  const handleDelete = (msg, isOwnMessage) => {
    if (onDeleteMessage) onDeleteMessage(msg, isOwnMessage);
  };

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

        {/* Menu contextuel réutilisé (sans Reply / Forward) */}
        <MessageContextMenu
          message={message}
          isOwnMessage={isOwn}
          onEdit={onEditMessage ? handleEdit : undefined}
          onCopy={handleCopy}
          onDelete={onDeleteMessage ? handleDelete : undefined}
        />
      </div>
    </div>
  );
};

export default MessageItem;
