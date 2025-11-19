// src/components/Dashboard/UserDashboard/Chat/GroupMessageItem.jsx
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

const GroupMessageItem = ({ message, isOwn, showAvatar, currentUser }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [localMessage, setLocalMessage] = useState(message);
  const [deletedForMe, setDeletedForMe] = useState(false);

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: ''
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: ''
  });
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

  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (typeof photoPath !== 'string') return null;
    if (photoPath.startsWith('http')) return photoPath;

    const backendUrl =
      process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';

    if (photoPath.startsWith('/uploads')) {
      return `${backendUrl}${photoPath}`;
    }

    if (!photoPath.includes('/')) {
      return `${backendUrl}/uploads/profiles/${photoPath}`;
    }

    const normalizedPath = photoPath.startsWith('/')
      ? photoPath
      : `/${photoPath}`;
    return `${backendUrl}${normalizedPath}`;
  };

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

  const handleEdit = async () => {
    setShowMenu(false);
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
      await friendsAPI.editMessage(id, trimmed);

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

  const handleCopy = async () => {
    setShowMenu(false);
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

  const handleDelete = () => {
    setShowMenu(false);
    setDeleteModal({ isOpen: true });
  };

  const confirmDelete = async () => {
    const id = getMessageId();

    try {
      await friendsAPI.deleteMessageAdvanced(id, !!isOwn);

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

  if (deletedForMe) return null;

  const avatarUrl = getImageUrl(
    localMessage.sender?.photo_profil || localMessage.sender?.avatar
  );

  return (
    <>
      <div
        className={`${styles.messageWrapper} ${
          isOwn ? styles.messageOwn : styles.messageOther
        }`}
      >
        {!isOwn && showAvatar && (
          <div className={styles.messageAvatar}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={senderDisplayName}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.textContent =
                      getInitialsFromUser(localMessage.sender);
                  }
                }}
              />
            ) : (
              <div className={styles.messageAvatarPlaceholder}>
                {getInitialsFromUser(localMessage.sender)}
              </div>
            )}
          </div>
        )}

        <div
          className={`${styles.messageBubble} ${
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
          } ${localMessage.tempId ? styles.messageSending : ''}`}
        >
          {!isOwn && senderDisplayName && (
            <div className={styles.messageAuthor}>{senderDisplayName}</div>
          )}

          {localMessage.deleted ? (
            <p className={styles.messageContent}>
              <em>This message was deleted</em>
            </p>
          ) : (
            <p className={styles.messageContent}>{localMessage.content}</p>
          )}

          <div className={styles.messageInfo}>
            <span className={styles.messageTime}>
              {formatTime(localMessage.created_date || localMessage.createdAt)}
            </span>
            {isOwn && (
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
              <FontAwesomeIcon
                icon={faEllipsisVertical}
                style={{ fontSize: 14 }}
              />
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
                    zIndex: 9999,
                    background: '#ffffff'
                  }}
                >
                  {isOwn && (
                    <button
                      className={styles.dropdownItem}
                      onClick={handleEdit}
                    >
                      <FontAwesomeIcon icon={faPen} style={{ fontSize: 14 }} />
                      Edit
                    </button>
                  )}

                  <button className={styles.dropdownItem} onClick={handleCopy}>
                    <FontAwesomeIcon icon={faCopy} style={{ fontSize: 14 }} />
                    Copy
                  </button>

                  <div className={styles.dropdownDivider} />

                  <button
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                    onClick={handleDelete}
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

export default GroupMessageItem;
