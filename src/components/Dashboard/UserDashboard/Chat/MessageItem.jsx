// src/components/Dashboard/UserDashboard/Chat/MessageItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCheckDouble,
  faEllipsisVertical,
  faCopy,
  faPen,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

/**
 * MessageItem
 *
 * - Affiche un message dans la conversation (texte / image / audio / vidéo)
 * - Gère le menu contextuel (Edit / Copy / Delete)
 * - NE FAIT AUCUN APPEL API DIRECT :
 *   -> onEditMessage(message)
 *   -> onCopyMessage(message)
 *   -> onDeleteMessage(message, isOwn)
 */
const MessageItem = ({
  message,
  isOwn,
  showAvatar,
  participant,
  currentUser,
  isGroup,
  onEditMessage,
  onCopyMessage,
  onDeleteMessage
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Format de l'heure
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

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const toggleMenu = (e) => {
    e.stopPropagation();

    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 5,
        left: isOwn ? rect.left - 150 : rect.right
      });
    }

    setShowMenu((prev) => !prev);
  };

  const handleMenuClick = (action) => {
    setShowMenu(false);
    if (action) action();
  };

  // === Actions ===
  const handleCopy = () => {
    if (onCopyMessage) {
      onCopyMessage(message);
    } else if (message?.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleEdit = () => {
    if (onEditMessage) onEditMessage(message);
  };

  const handleDelete = () => {
    if (onDeleteMessage) onDeleteMessage(message, isOwn);
  };

  return (
    <div
      className={`${styles.messageWrapper} ${
        isOwn ? styles.messageOwn : styles.messageOther
      }`}
    >
      {/* Avatar de l'autre utilisateur */}
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

        {/* Contenu du message */}
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

        {/* Infos (heure + statut) */}
        <div className={styles.messageInfo}>
          <span className={styles.messageTime}>
            {formatTime(message.created_date || message.createdAt)}
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

        {/* Bouton du menu */}
        <button
          ref={buttonRef}
          className={styles.messageMenuButton}
          onClick={toggleMenu}
          title="Message options"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>

        {/* Menu contextuel : Edit / Copy / Delete */}
        {showMenu && (
          <div>
            <div
              className={styles.menuOverlay}
              onClick={() => setShowMenu(false)}
            />
            <div
              ref={menuRef}
              className={`${styles.messageDropdown} ${
                isOwn ? styles.messageDropdownOwn : ''
              }`}
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 9999
              }}
            >
              {isOwn && onEditMessage && (
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleMenuClick(handleEdit)}
                >
                  <FontAwesomeIcon icon={faPen} />
                  <span>Edit</span>
                </button>
              )}

              <button
                className={styles.dropdownItem}
                onClick={() => handleMenuClick(handleCopy)}
              >
                <FontAwesomeIcon icon={faCopy} />
                <span>Copy</span>
              </button>

              <div className={styles.dropdownDivider} />

              {onDeleteMessage && (
                <button
                  className={`${styles.dropdownItem} ${styles.dangerItem}`}
                  onClick={() => handleMenuClick(handleDelete)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>{isOwn ? 'Delete for everyone' : 'Delete for me'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
