// src/components/Dashboard/UserDashboard/Chat/AddMembersModal.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faSearch,
  faUserPlus,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { friendsAPI } from '../../../../utils/api';
import CustomModal from './CustomModal';
import styles from './GroupModals.module.css';

const AddMembersModal = ({ isOpen, onClose, group, onMembersAdded }) => {
  const [friends, setFriends] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // États pour les modals
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFriends();
      
      if (response.success && Array.isArray(response.data)) {
        // Filtrer les amis qui ne sont pas déjà dans le groupe
        const currentMemberIds = (group?.participants || []).map((p) => p._id || p);
        const availableFriends = response.data.filter(
          (friend) => !currentMemberIds.includes(friend._id)
        );
        setFriends(availableFriends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load friends list'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setErrorModal({
        isOpen: true,
        message: 'Please select at least one member to add'
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await friendsAPI.addGroupMembers(
        group._id || group.groupId,
        selectedUsers
      );

      if (response.success) {
        setSuccessModal({
          isOpen: true,
          message: `Successfully added ${selectedUsers.length} member(s) to the group`
        });
        
        setTimeout(() => {
          if (onMembersAdded) {
            onMembersAdded();
          }
          onClose();
        }, 1500);
      } else {
        setErrorModal({
          isOpen: true,
          message: response.message || 'Failed to add members'
        });
      }
    } catch (error) {
      console.error('Error adding members:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while adding members'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const fullName = `${friend.prenom} ${friend.nom}`.toLowerCase();
    return fullName.includes(query) || friend.email?.toLowerCase().includes(query);
  });

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              Add Members
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
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className={styles.selectedCount}>
              {selectedUsers.length} member(s) selected
            </div>
          )}

          {/* Friends List */}
          <div className={styles.membersList}>
            {loading ? (
              <div className={styles.loading}>Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className={styles.noResults}>
                All your friends are already in this group
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className={styles.noResults}>
                No friends found matching "{searchQuery}"
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedUsers.includes(friend._id);

                return (
                  <div
                    key={friend._id}
                    className={`${styles.memberItem} ${styles.selectableItem} ${
                      isSelected ? styles.selectedItem : ''
                    }`}
                    onClick={() => toggleUserSelection(friend._id)}
                  >
                    <div className={styles.memberInfo}>
                      {/* Avatar */}
                      <div className={styles.memberAvatar}>
                        {friend.photo_profil ? (
                          <img src={friend.photo_profil} alt={friend.prenom} />
                        ) : (
                          <div className={styles.memberAvatarPlaceholder}>
                            {friend.prenom?.charAt(0)}{friend.nom?.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className={styles.memberDetails}>
                        <div className={styles.memberName}>
                          {friend.prenom} {friend.nom}
                        </div>
                        {friend.email && (
                          <div className={styles.memberEmail}>
                            {friend.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className={styles.checkbox}>
                      {isSelected && <FontAwesomeIcon icon={faCheck} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              onClick={handleAddMembers}
              disabled={submitting || selectedUsers.length === 0}
            >
              {submitting ? (
                'Adding...'
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} />
                  Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
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

export default AddMembersModal;