// src/components/Dashboard/UserDashboard/Chat/MessageItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faCheckDouble, 
  faEllipsisVertical,
  faReply,
  faCopy,
  faTrash,
  faForward
} from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const MessageItem = ({ message, isOwn, showAvatar, participant }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (nom, prenom) => {
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  return (
    <div className={`${styles.messageWrapper} ${isOwn ? styles.messageOwn : styles.messageOther}`}>
      {!isOwn && showAvatar && (
        <div className={styles.messageAvatar}>
          {participant.photo_profil ? (
            <img 
              src={participant.photo_profil} 
              alt={`${participant.prenom} ${participant.nom}`}
            />
          ) : (
            <div className={styles.messageAvatarPlaceholder}>
              {getInitials(participant.nom, participant.prenom)}
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
        {message.type === 'text' && (
          <p className={styles.messageContent}>{message.content}</p>
        )}
        
        {message.type === 'image' && (
          <div className={styles.messageImage}>
            <img src={message.content} alt="Shared" />
            {message.caption && <p className={styles.imageCaption}>{message.caption}</p>}
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
          <span className={styles.messageTime}>{formatTime(message.created_date)}</span>
          {isOwn && (
            <span className={styles.messageStatus}>
              <FontAwesomeIcon 
                icon={message.read ? faCheckDouble : faCheck}
                className={message.read ? styles.readIcon : styles.sentIcon}
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
            <div className={`${styles.messageDropdown} ${isOwn ? styles.messageDropdownOwn : ''}`}>
              <button className={styles.dropdownItem} onClick={() => setShowMenu(false)}>
                <FontAwesomeIcon icon={faReply} />
                Répondre
              </button>
              <button className={styles.dropdownItem} onClick={handleCopyMessage}>
                <FontAwesomeIcon icon={faCopy} />
                Copier
              </button>
              <button className={styles.dropdownItem} onClick={() => setShowMenu(false)}>
                <FontAwesomeIcon icon={faForward} />
                Transférer
              </button>
              {isOwn && (
                <>
                  <div className={styles.dropdownDivider} />
                  <button className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                    <FontAwesomeIcon icon={faTrash} />
                    Supprimer
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