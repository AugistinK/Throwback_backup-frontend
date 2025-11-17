// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import CustomModal from './CustomModal';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, conversation, isOnline, onBack }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  // États pour les différents modals
  const [blockModal, setBlockModal] = useState({ isOpen: false });
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

  // Voir le profil de l'utilisateur
  const handleViewProfile = () => {
    if (isGroup || !participant?._id) {
      setErrorModal({
        isOpen: true,
        message: 'Profile viewing is not available for groups.'
      });
      setShowMenu(false);
      return;
    }

    setShowMenu(false);
    // Naviguer vers la page de profil de l'utilisateur
    navigate(`/profile/${participant._id}`);
  };

  // Bloquer un utilisateur
  const handleBlockUser = async () => {
    if (isGroup || !participant?._id) return;

    setShowMenu(false);
    setBlockModal({ isOpen: true });
  };

  const confirmBlockUser = async () => {
    try {
      const res = await friendsAPI.blockUser(participant._id);
      
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: `${userName} has been blocked successfully. They can no longer send you messages.`
        });
        
        // Retourner à la liste des conversations après un délai
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to block this user. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while blocking this user. Please try again.'
      });
    }
  };

  // Supprimer la conversation
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
        
        // Retourner à la liste des conversations après un délai
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to delete conversation history. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while deleting the conversation. Please try again.'
      });
    }
  };

  // Désactiver les notifications
  const handleToggleNotifications = () => {
    setShowMenu(false);
    setMuteModal({ isOpen: true });
  };

  const confirmMuteNotifications = async () => {
    try {
      // API call pour mute - à implémenter
      setSuccessModal({
        isOpen: true,
        message: 'Notifications have been muted for this conversation.'
      });
    } catch (error) {
      console.error('Error muting notifications:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to mute notifications. Please try again.'
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
                  onClick={handleViewProfile}
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

      {/* Modals de confirmation */}
      <CustomModal
        isOpen={blockModal.isOpen}
        onClose={() => setBlockModal({ isOpen: false })}
        title="Block User"
        message={`Are you sure you want to block ${userName}? They will no longer be able to send you messages or see your profile.`}
        onConfirm={confirmBlockUser}
        confirmText="Block"
        cancelText="Cancel"
        isDanger={true}
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
        message={`Do you want to mute notifications for this conversation? You will stop receiving alerts for new messages.`}
        onConfirm={confirmMuteNotifications}
        confirmText="Mute"
        cancelText="Cancel"
      />

      {/* Modals de succès et d'erreur */}
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

export default ChatHeader;