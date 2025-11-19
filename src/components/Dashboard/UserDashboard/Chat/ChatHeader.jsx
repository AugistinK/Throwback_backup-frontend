// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEllipsisVertical,
  faCircle,
  faBan,
  faTrash,
  faBellSlash,
  faUnlock
} from '@fortawesome/free-solid-svg-icons';
import { friendsAPI } from '../../../../utils/api';
import CustomModal from './CustomModal';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, conversation, isOnline, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  const [blockModal, setBlockModal] = useState({ isOpen: false });
  const [unblockModal, setUnblockModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [muteModal, setMuteModal] = useState({ isOpen: false });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

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

  // Vérifier si l'utilisateur est bloqué
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!participant?._id) return;
      
      try {
        const res = await friendsAPI.getBlockedUsers();
        if (res.success && Array.isArray(res.data)) {
          const blocked = res.data.some(
            (blocked) => blocked._id === participant._id
          );
          setIsBlocked(blocked);
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    };

    checkBlockStatus();
  }, [participant]);

  // Fermer menu si clic en dehors
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

  const handleBlockUser = () => {
    if (isGroup || !participant?._id) return;
    setShowMenu(false);
    setBlockModal({ isOpen: true });
  };

  const confirmBlockUser = async () => {
    try {
      const res = await friendsAPI.blockUser(participant._id);
      
      if (res.success) {
        setIsBlocked(true);
        setSuccessModal({
          isOpen: true,
          message: `${userName} has been blocked successfully.`
        });
        
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to block this user.'
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while blocking this user.'
      });
    }
  };

  const handleUnblockUser = () => {
    if (isGroup || !participant?._id) return;
    setShowMenu(false);
    setUnblockModal({ isOpen: true });
  };

  const confirmUnblockUser = async () => {
    try {
      const res = await friendsAPI.unblockUser(participant._id);
      
      if (res.success) {
        setIsBlocked(false);
        setSuccessModal({
          isOpen: true,
          message: `${userName} has been unblocked successfully.`
        });
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to unblock this user.'
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while unblocking this user.'
      });
    }
  };

  const handleClearConversation = () => {
    if (isGroup || !participant?._id) return;
    setShowMenu(false);
    setDeleteModal({ isOpen: true });
  };

  const confirmClearConversation = async () => {
    try {
      const res = await friendsAPI.clearChatHistory(participant._id);
      
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'Conversation history has been deleted successfully.'
        });
        
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to delete conversation history.'
        });
      }
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while deleting the conversation.'
      });
    }
  };

  const handleToggleNotifications = () => {
    setShowMenu(false);
    setMuteModal({ isOpen: true });
  };

  const confirmMuteNotifications = async () => {
    try {
      setSuccessModal({
        isOpen: true,
        message: 'Notifications have been muted for this conversation.'
      });
    } catch (error) {
      console.error('Error muting notifications:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to mute notifications.'
      });
    }
  };

  return (
    <>
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
          <button
            ref={buttonRef}
            className={styles.headerActionButton}
            onClick={() => {
              console.log('Menu toggle:', !showMenu);
              setShowMenu(!showMenu);
            }}
            title="More options"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>

          {showMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998
                }}
                onClick={() => setShowMenu(false)}
              />
              <div
                ref={menuRef}
                style={{
                  position: 'fixed',
                  top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 60,
                  right: '20px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  minWidth: '200px',
                  zIndex: 9999,
                  overflow: 'hidden'
                }}
              >
                <MenuItem
                  icon={faBellSlash}
                  label="Mute notifications"
                  onClick={handleToggleNotifications}
                />

                {!isGroup && (
                  <>
                    <MenuDivider />
                    
                    {isBlocked ? (
                      <MenuItem
                        icon={faUnlock}
                        label="Unblock user"
                        onClick={handleUnblockUser}
                      />
                    ) : (
                      <MenuItem
                        icon={faBan}
                        label="Block user"
                        onClick={handleBlockUser}
                        danger
                      />
                    )}
                    
                    <MenuItem
                      icon={faTrash}
                      label="Delete conversation"
                      onClick={handleClearConversation}
                      danger
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CustomModal
        isOpen={blockModal.isOpen}
        onClose={() => setBlockModal({ isOpen: false })}
        title="Block User"
        message={`Are you sure you want to block ${userName}? They will no longer be able to send you messages.`}
        onConfirm={confirmBlockUser}
        confirmText="Block"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={unblockModal.isOpen}
        onClose={() => setUnblockModal({ isOpen: false })}
        title="Unblock User"
        message={`Are you sure you want to unblock ${userName}?`}
        onConfirm={confirmUnblockUser}
        confirmText="Unblock"
        cancelText="Cancel"
      />

      <CustomModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Delete Conversation"
        message={`Are you sure you want to delete your conversation history with ${userName}? This action cannot be undone.`}
        onConfirm={confirmClearConversation}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={muteModal.isOpen}
        onClose={() => setMuteModal({ isOpen: false })}
        title="Mute Notifications"
        message={`Do you want to mute notifications for this conversation?`}
        onConfirm={confirmMuteNotifications}
        confirmText="Mute"
        cancelText="Cancel"
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

// Composants helper pour le menu
const MenuItem = ({ icon, label, onClick, danger = false }) => (
  <button
    style={{
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      background: 'white',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: danger ? '#dc3545' : '#333',
      transition: 'background 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = danger ? '#fee' : '#f5f5f5'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
    onClick={onClick}
  >
    <FontAwesomeIcon icon={icon} />
    {label}
  </button>
);

const MenuDivider = () => (
  <div style={{ height: '1px', background: '#e0e0e0', margin: '4px 0' }} />
);

export default ChatHeader;