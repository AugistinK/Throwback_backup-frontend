// src/components/Dashboard/UserDashboard/Chat/GroupMembersModal.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faUserPlus,
  faUserMinus,
  faCrown,
  faShield,
  faUser,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { friendsAPI } from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';
import CustomModal from './CustomModal';
import styles from './GroupModals.module.css';

const GroupMembersModal = ({ isOpen, onClose, group, onMembersUpdated }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // États pour les modals de confirmation
  const [removeModal, setRemoveModal] = useState({ isOpen: false, member: null });
  const [promoteModal, setPromoteModal] = useState({ isOpen: false, member: null });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  const currentUserId = user?.id || user?._id;
  const isCreator = group?.groupCreator?._id === currentUserId || group?.groupCreator === currentUserId;
  const isAdmin = group?.groupAdmins?.some(
    (admin) => (admin._id || admin) === currentUserId
  );

  useEffect(() => {
    if (isOpen && group) {
      loadMembers();
    }
  }, [isOpen, group]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getGroupDetails(group._id || group.groupId);
      
      if (response.success) {
        setMembers(response.data.participants || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load group members'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (member) => {
    setRemoveModal({
      isOpen: true,
      member
    });
  };

  const confirmRemoveMember = async () => {
    const member = removeModal.member;
    
    try {
      const response = await friendsAPI.removeGroupMember(
        group._id || group.groupId,
        member._id
      );

      if (response.success) {
        setMembers((prev) => prev.filter((m) => m._id !== member._id));
        setSuccessModal({
          isOpen: true,
          message: `${member.prenom} ${member.nom} has been removed from the group`
        });
        
        if (onMembersUpdated) {
          onMembersUpdated();
        }
      } else {
        setErrorModal({
          isOpen: true,
          message: response.message || 'Failed to remove member'
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while removing the member'
      });
    } finally {
      setRemoveModal({ isOpen: false, member: null });
    }
  };

  const handlePromoteToAdmin = (member) => {
    setPromoteModal({
      isOpen: true,
      member
    });
  };

  const confirmPromoteToAdmin = async () => {
    const member = promoteModal.member;
    
    try {
      const response = await friendsAPI.promoteToAdmin(
        group._id || group.groupId,
        member._id
      );

      if (response.success) {
        setSuccessModal({
          isOpen: true,
          message: `${member.prenom} ${member.nom} is now an admin`
        });
        
        await loadMembers();
        
        if (onMembersUpdated) {
          onMembersUpdated();
        }
      } else {
        setErrorModal({
          isOpen: true,
          message: response.message || 'Failed to promote member'
        });
      }
    } catch (error) {
      console.error('Error promoting member:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while promoting the member'
      });
    } finally {
      setPromoteModal({ isOpen: false, member: null });
    }
  };

  const getMemberRole = (memberId) => {
    if ((group?.groupCreator?._id || group?.groupCreator) === memberId) {
      return 'creator';
    }
    if (group?.groupAdmins?.some((admin) => (admin._id || admin) === memberId)) {
      return 'admin';
    }
    return 'member';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'creator':
        return faCrown;
      case 'admin':
        return faShield;
      default:
        return faUser;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'creator':
        return 'Creator';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'creator':
        return styles.roleCreator;
      case 'admin':
        return styles.roleAdmin;
      default:
        return styles.roleMember;
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const fullName = `${member.prenom} ${member.nom}`.toLowerCase();
    return fullName.includes(query) || member.email?.toLowerCase().includes(query);
  });

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              Group Members ({members.length})
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Members List */}
          <div className={styles.membersList}>
            {loading ? (
              <div className={styles.loading}>Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className={styles.noResults}>
                {searchQuery ? 'No members found' : 'No members in this group'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const role = getMemberRole(member._id);
                const isSelf = member._id === currentUserId;
                const canRemove = (isCreator || isAdmin) && role === 'member' && !isSelf;
                const canPromote = isCreator && role === 'member' && !isSelf;

                return (
                  <div key={member._id} className={styles.memberItem}>
                    <div className={styles.memberInfo}>
                      {/* Avatar */}
                      <div className={styles.memberAvatar}>
                        {member.photo_profil ? (
                          <img src={member.photo_profil} alt={member.prenom} />
                        ) : (
                          <div className={styles.memberAvatarPlaceholder}>
                            {member.prenom?.charAt(0)}{member.nom?.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className={styles.memberDetails}>
                        <div className={styles.memberName}>
                          {member.prenom} {member.nom}
                          {isSelf && <span className={styles.youBadge}>(You)</span>}
                        </div>
                        <div className={`${styles.memberRole} ${getRoleClass(role)}`}>
                          <FontAwesomeIcon icon={getRoleIcon(role)} />
                          {getRoleLabel(role)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isSelf && (isCreator || isAdmin) && (
                      <div className={styles.memberActions}>
                        {canPromote && (
                          <button
                            className={styles.actionButton}
                            onClick={() => handlePromoteToAdmin(member)}
                            title="Promote to admin"
                          >
                            <FontAwesomeIcon icon={faUserPlus} />
                          </button>
                        )}
                        
                        {canRemove && (
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                            onClick={() => handleRemoveMember(member)}
                            title="Remove member"
                          >
                            <FontAwesomeIcon icon={faUserMinus} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals de confirmation */}
      <CustomModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, member: null })}
        title="Remove Member"
        message={`Are you sure you want to remove ${removeModal.member?.prenom} ${removeModal.member?.nom} from this group?`}
        onConfirm={confirmRemoveMember}
        confirmText="Remove"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={promoteModal.isOpen}
        onClose={() => setPromoteModal({ isOpen: false, member: null })}
        title="Promote to Admin"
        message={`Are you sure you want to promote ${promoteModal.member?.prenom} ${promoteModal.member?.nom} to admin? They will be able to manage members and group settings.`}
        onConfirm={confirmPromoteToAdmin}
        confirmText="Promote"
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

export default GroupMembersModal;
