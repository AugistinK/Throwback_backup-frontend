// src/components/Dashboard/UserDashboard/Chat/MessageItem.jsx - AVEC SUPPORT GROUPE/DIRECT
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
import { friendsAPI } from '../../../../utils/api';
import CustomModal from './CustomModal';
import styles from './Chat.module.css';

const MessageItem = ({
  message,
  isOwn,
  showAvatar,
  participant,
  currentUser,
  isGroup,
  groupId, // NOUVEAU : ID du groupe si message de groupe
  onEdit,
  onCopy,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [localMessage, setLocalMessage] = useState(message);
  const [deletedForMe, setDeletedForMe] = useState(false);
  
  // Modals
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setLocalMessage(message);
  }, [message]);

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
    ? localMessage.sender
    : isOwn
    ? currentUser
    : participant;

  const senderDisplayName = (() => {
    const u = localMessage.sender;
    if (!u) return '';
    const first = u?.prenom || u?.firstName || u?.name || '';
    const last = u?.nom || u?.lastName || '';
    return `${first} ${last}`.trim() || first || last;
  })();

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

  const handleMenuClick = (action) => {
    setShowMenu(false);
    if (action) action();
  };

  const toggleMenu = (e) => {
    e.stopPropagation();

    if (!showMenu && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.bottom + 5,
        left: isOwn ? buttonRect.left - 150 : buttonRect.right
      });
    }

    setShowMenu(!showMenu);
  };

  const getMessageId = () =>
    localMessage._id || localMessage.id || message._id || message.id;

  const handleEditInternal = async () => {
    const currentText = localMessage.content || localMessage.text || '';
    const next = window.prompt('Edit your message', currentText);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentText) return;

    const id = getMessageId();
    if (!id) {
      setErrorModal({
        isOpen: true,
        message: 'Cannot edit message: missing ID'
      });
      return;
    }

    try {
      // Utiliser l'API appropriée selon le type de message
      if (isGroup && groupId) {
        await friendsAPI.editGroupMessage(groupId, id, trimmed);
      } else {
        await friendsAPI.editMessage(id, trimmed);
      }

      setLocalMessage((prev) => ({
        ...prev,
        content: trimmed,
        text: trimmed,
        edited: true
      }));
      
      setSuccessModal({
        isOpen: true,
        message: 'Message edited successfully'
      });
    } catch (err) {
      console.error('Error editing message:', err);
      setErrorModal({
        isOpen: true,
        message: 'Failed to edit message. Please try again.'
      });
    }
  };

  const handleCopyInternal = async () => {
    const textToCopy = localMessage.content || localMessage.text || '';

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setSuccessModal({
        isOpen: true,
        message: 'Message copied to clipboard'
      });
    } catch (err) {
      console.error('Error copying message:', err);
      setErrorModal({
        isOpen: true,
        message: 'Failed to copy message'
      });
    }
  };

  const handleDeleteInternal = async () => {
    const id = getMessageId();
    if (!id) {
      setErrorModal({
        isOpen: true,
        message: 'Cannot delete message: missing ID'
      });
      return;
    }

    setDeleteModal({ isOpen: true });
  };

  const confirmDelete = async () => {
    const id = getMessageId();
    
    try {
      // Utiliser l'API appropriée selon le type de message
      if (isGroup && groupId) {
        await friendsAPI.deleteGroupMessage(groupId, id, !!isOwn);
      } else {
        await friendsAPI.deleteMessage(id, !!isOwn);
      }

      if (isOwn) {
        setLocalMessage((prev) => ({
          ...prev,
          content: 'This message was deleted',
          text: 'This message was deleted',
          deleted: true
        }));
      } else {
        setDeletedForMe(true);
      }
      
      setSuccessModal({
        isOpen: true,
        message: 'Message deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting message:', err);
      setErrorModal({
        isOpen: true,
        message: 'Failed to delete message. Please try again.'
      });
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(localMessage);
    } else {
      handleEditInternal();
    }
  };

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy(localMessage);
    } else {
      handleCopyInternal();
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(localMessage, isOwn);
    } else {
      handleDeleteInternal();
    }
  };

  if (deletedForMe) return null;

  return (
    <>
      <div
        className={`${styles.messageWrapper} ${
          isOwn ? styles.messageOwn : styles.messageOther
        }`}
      >
        {!isOwn && showAvatar && (
          <div className={styles.messageAvatar}>
            {senderForAvatar?.photo_profil ? (
              <img src={senderForAvatar.photo_profil} alt={senderDisplayName} />
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
          } ${localMessage.tempId ? styles.messageSending : ''}`}
        >
          {isGroup && !isOwn && senderDisplayName && (
            <div className={styles.messageAuthor}>{senderDisplayName}</div>
          )}

          {localMessage.deleted || localMessage.deletedForEveryone ? (
            <p className={styles.messageContent}>
              <em>This message was deleted</em>
            </p>
          ) : (
            <>
              {localMessage.type === 'text' && (
                <p className={styles.messageContent}>{localMessage.content}</p>
              )}

              {localMessage.type === 'image' && (
                <div className={styles.messageImage}>
                  <img src={localMessage.content} alt="Shared" />
                  {localMessage.caption && (
                    <p className={styles.imageCaption}>{localMessage.caption}</p>
                  )}
                </div>
              )}

              {localMessage.type === 'audio' && (
                <div className={styles.messageAudio}>
                  <audio controls src={localMessage.content}></audio>
                </div>
              )}

              {localMessage.type === 'video' && (
                <div className={styles.messageVideo}>
                  <video controls src={localMessage.content}></video>
                </div>
              )}
            </>
          )}

          <div className={styles.messageInfo}>
            <span className={styles.messageTime}>
              {formatTime(
                localMessage.created_date || localMessage.createdAt
              )}
            </span>
            {isOwn && !isGroup && (
              <span className={styles.messageStatus}>
                <FontAwesomeIcon
                  icon={localMessage.read ? faCheckDouble : faCheck}
                  className={
                    localMessage.read ? styles.readIcon : styles.sentIcon
                  }
                />
              </span>
            )}
          </div>

          <div className={styles.messageActions}>
            <button
              ref={buttonRef}
              className={styles.messageMenuButton}
              onClick={toggleMenu}
              title="Message options"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize: 14 }} />
            </button>

            {showMenu && (
              <>
                <div
                  className={styles.menuOverlay}
                  onClick={() => setShowMenu(false)}
                />
                <div
                  ref={menuRef}
                  className={styles.messageDropdown}
                  style={{
                    position: 'fixed',
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                    zIndex: 9999
                  }}
                >
                  {isOwn && !localMessage.deleted && !localMessage.deletedForEveryone && (
                    <button
                      className={styles.dropdownItem}
                      onClick={() => handleMenuClick(handleEditClick)}
                    >
                      <FontAwesomeIcon icon={faPen} style={{ fontSize: 14 }} />
                      Edit
                    </button>
                  )}

                  {!localMessage.deleted && !localMessage.deletedForEveryone && (
                    <button
                      className={styles.dropdownItem}
                      onClick={() => handleMenuClick(handleCopyClick)}
                    >
                      <FontAwesomeIcon icon={faCopy} style={{ fontSize: 14 }} />
                      Copy
                    </button>
                  )}

                  <div className={styles.dropdownDivider} />

                  <button
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                    onClick={() => handleMenuClick(handleDeleteClick)}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                    {isOwn ? 'Delete for everyone' : 'Delete for me'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Delete Message"
        message={
          isOwn
            ? 'Delete this message for everyone? This cannot be undone.'
            : 'Delete this message for you?'
        }
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: '' })}
        title="Success"
        message={successModal.message}
        type="alert"
        confirmText="OK"
      />

      <CustomModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Error"
        message={errorModal.message}
        type="alert"
        confirmText="OK"
        isDanger={true}
      />
    </>
  );
};

export default MessageItem;