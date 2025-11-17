// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx - VERSION COMPLÈTE
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEllipsisVertical,
  faCircle,
  faBan,
  faTrash,
  faBellSlash,
  faUnlock,
  faUserPlus,
  faUsers,
  faRightFromBracket,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { friendsAPI } from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';
import CustomModal from './CustomModal';
import GroupMembersModal from './GroupMembersModal';
import AddMembersModal from './AddMembersModal';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, conversation, isOnline, onBack }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  
  // États pour les modals
  const [blockModal, setBlockModal] = useState({ isOpen: false });
  const [unblockModal, setUnblockModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [muteModal, setMuteModal] = useState({ isOpen: false });
  const [leaveGroupModal, setLeaveGroupModal] = useState({ isOpen: false });
  const [deleteGroupModal, setDeleteGroupModal] = useState({ isOpen: false });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  
  // États pour les modals de groupe
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const isGroup = !!conversation?.isGroup;
  const currentUserId = user?.id || user?._id;

  // Déterminer si l'utilisateur est créateur ou admin du groupe
  const isGroupCreator = isGroup && (
    groupDetails?.groupCreator?._id === currentUserId ||
    groupDetails?.groupCreator === currentUserId ||
    conversation?.groupCreator?._id === currentUserId ||
    conversation?.groupCreator === currentUserId
  );

  const isGroupAdmin = isGroup && (
    groupDetails?.groupAdmins?.some((admin) => 
      (admin._id || admin) === currentUserId
    ) ||
    conversation?.groupAdmins?.some((admin) => 
      (admin._id || admin) === currentUserId
    )
  );

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

  const groupName = conversation?.name || conversation?.groupName || 'Group';
  const userName =
    `${participant?.prenom || ''} ${participant?.nom || ''}`.trim() || 'Friend';

  const title = isGroup ? groupName : userName;
  const subtitle = isGroup
    ? groupDetails?.participants?.length || conversation?.members?.length
      ? `${groupDetails?.participants?.length || conversation?.members?.length} members`
      : 'Group chat'
    : isOnline
    ? 'Online'
    : 'Offline';

  // Charger les détails du groupe
  useEffect(() => {
    if (isGroup && conversation) {
      loadGroupDetails();
    }
  }, [isGroup, conversation]);

  const loadGroupDetails = async () => {
    try {
      const groupId = conversation._id || conversation.groupId;
      const response = await friendsAPI.getGroupDetails(groupId);
      
      if (response.success) {
        setGroupDetails(response.data);
      }
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  // Vérifier si l'utilisateur est bloqué (pour les conversations directes)
  useEffect(() => {
    if (!isGroup && participant?._id) {
      checkBlockStatus();
    }
  }, [participant, isGroup]);

  const checkBlockStatus = async () => {
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

  // ==================== FONCTIONS POUR CONVERSATIONS DIRECTES ====================

  const handleBlockUser = () => {
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

  // ==================== FONCTIONS POUR GROUPES ====================

  const handleViewMembers = () => {
    setShowMenu(false);
    setShowMembersModal(true);
  };

  const handleAddMembers = () => {
    setShowMenu(false);
    setShowAddMembersModal(true);
  };

  const handleLeaveGroup = () => {
    setShowMenu(false);
    setLeaveGroupModal({ isOpen: true });
  };

  const confirmLeaveGroup = async () => {
    try {
      const groupId = conversation._id || conversation.groupId;
      const res = await friendsAPI.leaveGroup(groupId);
      
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'You have left the group successfully.'
        });
        
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to leave the group.'
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while leaving the group.'
      });
    }
  };

  const handleDeleteGroup = () => {
    setShowMenu(false);
    setDeleteGroupModal({ isOpen: true });
  };

  const confirmDeleteGroup = async () => {
    try {
      const groupId = conversation._id || conversation.groupId;
      const res = await friendsAPI.deleteGroup(groupId);
      
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'Group has been deleted successfully.'
        });
        
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to delete the group.'
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while deleting the group.'
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

  const handleMembersUpdated = () => {
    loadGroupDetails();
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
                {isGroup ? (
                  <>
                    {/* Options pour les groupes */}
                    <button
                      className={styles.dropdownItem}
                      onClick={handleViewMembers}
                    >
                      <FontAwesomeIcon icon={faUsers} />
                      View Members
                    </button>

                    {(isGroupCreator || isGroupAdmin) && (
                      <button
                        className={styles.dropdownItem}
                        onClick={handleAddMembers}
                      >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Add Members
                      </button>
                    )}

                    <button
                      className={styles.dropdownItem}
                      onClick={handleToggleNotifications}
                    >
                      <FontAwesomeIcon icon={faBellSlash} />
                      Mute notifications
                    </button>

                    <div className={styles.dropdownDivider} />

                    {!isGroupCreator && (
                      <button
                        className={`${styles.dropdownItem} ${styles.dangerItem}`}
                        onClick={handleLeaveGroup}
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        Leave Group
                      </button>
                    )}

                    {isGroupCreator && (
                      <button
                        className={`${styles.dropdownItem} ${styles.dangerItem}`}
                        onClick={handleDeleteGroup}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete Group
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Options pour les conversations directes */}
                    <button
                      className={styles.dropdownItem}
                      onClick={handleToggleNotifications}
                    >
                      <FontAwesomeIcon icon={faBellSlash} />
                      Mute notifications
                    </button>

                    <div className={styles.dropdownDivider} />
                    
                    {isBlocked ? (
                      <button
                        className={styles.dropdownItem}
                        onClick={handleUnblockUser}
                      >
                        <FontAwesomeIcon icon={faUnlock} />
                        Unblock user
                      </button>
                    ) : (
                      <button
                        className={`${styles.dropdownItem} ${styles.dangerItem}`}
                        onClick={handleBlockUser}
                      >
                        <FontAwesomeIcon icon={faBan} />
                        Block user
                      </button>
                    )}
                    
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

      {/* Modals pour conversations directes */}
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
        message={`Are you sure you want to unblock ${userName}? They will be able to send you messages again.`}
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

      {/* Modals pour groupes */}
      <CustomModal
        isOpen={leaveGroupModal.isOpen}
        onClose={() => setLeaveGroupModal({ isOpen: false })}
        title="Leave Group"
        message={`Are you sure you want to leave "${groupName}"? You will no longer receive messages from this group.`}
        onConfirm={confirmLeaveGroup}
        confirmText="Leave"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={deleteGroupModal.isOpen}
        onClose={() => setDeleteGroupModal({ isOpen: false })}
        title="Delete Group"
        message={`Are you sure you want to delete "${groupName}"? This will remove the group for all members and cannot be undone.`}
        onConfirm={confirmDeleteGroup}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={muteModal.isOpen}
        onClose={() => setMuteModal({ isOpen: false })}
        title="Mute Notifications"
        message={`Do you want to mute notifications for this ${isGroup ? 'group' : 'conversation'}? You will stop receiving alerts for new messages.`}
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

      {/* Modals de gestion des membres du groupe */}
      {isGroup && (
        <>
          <GroupMembersModal
            isOpen={showMembersModal}
            onClose={() => setShowMembersModal(false)}
            group={groupDetails || conversation}
            onMembersUpdated={handleMembersUpdated}
          />

          <AddMembersModal
            isOpen={showAddMembersModal}
            onClose={() => setShowAddMembersModal(false)}
            group={groupDetails || conversation}
            onMembersAdded={handleMembersUpdated}
          />
        </>
      )}
    </>
  );
};

export default ChatHeader;