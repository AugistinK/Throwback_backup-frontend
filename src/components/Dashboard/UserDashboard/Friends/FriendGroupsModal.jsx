// src/components/Dashboard/UserDashboard/Friends/FriendGroupsModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './Friends.module.css';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPlus,
  faPen,
  faTrash,
  faUsers,
  faCheck,
  faMessage
} from '@fortawesome/free-solid-svg-icons';

import friendsAPI from '../../../../utils/friendsAPI';

/**
 * Normalise un groupe pour avoir toujours id / _id / name / members / color
 */
const normalizeGroup = (group) => {
  if (!group) return null;

  const rawMembers = Array.isArray(group.members) ? group.members : [];

  const memberIds = rawMembers
    .map((m) => {
      if (!m) return null;
      if (typeof m === 'string') return m;
      if (typeof m === 'number') return m;
      return m._id || m.id || null;
    })
    .filter(Boolean);

  return {
    ...group,
    id: group.id || group._id,
    _id: group._id || group.id,
    name: group.name || group.groupName || '',
    members: memberIds,
    color: group.color || '#b31217'
  };
};

const FriendGroupsModal = ({
  groups = [],
  friends = [],
  onClose,
  onSave,
  onOpenGroupChat
}) => {
  const [localGroups, setLocalGroups] = useState(() =>
    (groups || []).map(normalizeGroup).filter(Boolean)
  );
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#b31217');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = [
    '#b31217',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316'
  ];

  // Re-synchroniser quand la prop groups change (refresh global)
  useEffect(() => {
    setLocalGroups((groups || []).map(normalizeGroup).filter(Boolean));
  }, [groups]);

  const getFriendDisplayName = (friend) => {
    if (!friend) return 'Unknown';
    if (friend.name) return friend.name;
    const full = `${friend.prenom || ''} ${friend.nom || ''}`.trim();
    if (full) return full;
    return friend.email || 'Unknown';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const toggleMember = (friendId) => {
    setSelectedMembers((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const resetForm = () => {
    setNewGroupName('');
    setSelectedColor('#b31217');
    setSelectedMembers([]);
    setEditingGroup(null);
    setShowCreateForm(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0 || loading) return;

    try {
      setLoading(true);
      const payload = {
        name: newGroupName.trim(),
        members: selectedMembers,
        color: selectedColor
      };

      const response = await friendsAPI.createFriendGroup(payload);

      if (!response?.success) {
        alert(response?.message || 'Failed to create group');
        return;
      }

      const apiGroup = response.data;
      const normalized = normalizeGroup(apiGroup);

      setLocalGroups((prev) => [...prev, normalized]);
      resetForm();
    } catch (error) {
      console.error('Error creating friend group:', error);
      alert('An error occurred while creating the group.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim() || loading) return;

    try {
      setLoading(true);
      const groupId = editingGroup._id || editingGroup.id;

      const payload = {
        name: newGroupName.trim(),
        members: selectedMembers,
        color: selectedColor
      };

      const response = await friendsAPI.updateFriendGroup(groupId, payload);

      if (!response?.success) {
        alert(response?.message || 'Failed to update group');
        return;
      }

      const updated = normalizeGroup(response.data);

      setLocalGroups((prev) =>
        prev.map((g) =>
          (g._id || g.id) === (updated._id || updated.id) ? updated : g
        )
      );
      resetForm();
    } catch (error) {
      console.error('Error updating friend group:', error);
      alert('An error occurred while updating the group.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!groupId || loading) return;
    const confirmDelete = window.confirm('Delete this group?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await friendsAPI.deleteFriendGroup(groupId);

      if (!response?.success) {
        alert(response?.message || 'Failed to delete group');
        return;
      }

      setLocalGroups((prev) =>
        prev.filter((g) => (g._id || g.id) !== groupId)
      );
    } catch (error) {
      console.error('Error deleting friend group:', error);
      alert('An error occurred while deleting the group.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group) => {
    if (!group) return;
    setEditingGroup(group);
    setNewGroupName(group.name || '');
    setSelectedColor(group.color || '#b31217');
    setSelectedMembers(Array.isArray(group.members) ? group.members : []);
    setShowCreateForm(true);
  };

  const getMemberNames = (memberIds = []) => {
    return memberIds
      .map((id) => {
        const friend = friends.find((f) => f.id === id || f._id === id);
        if (!friend) return null;
        return getFriendDisplayName(friend);
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleOpenChat = (group) => {
    if (onOpenGroupChat) {
      onOpenGroupChat(group);
    }
  };

  const handleSaveAndClose = () => {
    if (onSave) {
      onSave(localGroups);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 24 }} />
            Friend Groups
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Formulaire de création / édition */}
          {showCreateForm ? (
            <div className={styles.groupForm}>
              <h3 className={styles.formTitle}>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Choose Color</label>
                <div className={styles.colorPicker}>
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={styles.colorOption}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          style={{ fontSize: 16, color: 'white' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Select Members ({selectedMembers.length})
                </label>
                <div className={styles.membersList}>
                  {friends.map((friend) => {
                    const friendId = friend.id || friend._id;
                    const displayName = getFriendDisplayName(friend);
                    const avatar = friend.avatar || friend.photo_profil;

                    return (
                      <label key={friendId} className={styles.memberItem}>
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(friendId)}
                          onChange={() => toggleMember(friendId)}
                          className={styles.checkbox}
                        />
                        <div className={styles.miniAvatar}>
                          {avatar ? (
                            <img src={avatar} alt={displayName} />
                          ) : (
                            <div className={styles.miniAvatarPlaceholder}>
                              {getInitials(displayName)}
                            </div>
                          )}
                        </div>
                        <span>{displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.cancelButton}
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  type="button"
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  disabled={
                    loading ||
                    !newGroupName.trim() ||
                    selectedMembers.length === 0
                  }
                >
                  {editingGroup ? 'Update' : 'Create'} Group
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Liste des groupes */}
              <div className={styles.groupsList}>
                {localGroups.map((group) => (
                  <div
                    key={group._id || group.id}
                    className={styles.groupItem}
                  >
                    <div
                      className={styles.groupColor}
                      style={{ backgroundColor: group.color || '#b31217' }}
                    />
                    <div className={styles.groupInfo}>
                      <h4 className={styles.groupName}>{group.name}</h4>
                      <p className={styles.groupMembers}>
                        {group.members?.length || 0} members:{' '}
                        {getMemberNames(group.members)}
                      </p>
                    </div>
                    <div className={styles.groupActions}>
                      <button
                        className={styles.iconButton}
                        type="button"
                        onClick={() => handleOpenChat(group)}
                        title="Open group chat"
                      >
                        <FontAwesomeIcon
                          icon={faMessage}
                          style={{ fontSize: 18, color: '#10b981' }}
                        />
                      </button>
                      <button
                        className={styles.iconButton}
                        type="button"
                        onClick={() => handleEditGroup(group)}
                        title="Edit group"
                      >
                        <FontAwesomeIcon
                          icon={faPen}
                          style={{ fontSize: 18 }}
                        />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.dangerButton}`}
                        type="button"
                        onClick={() =>
                          handleDeleteGroup(group._id || group.id)
                        }
                        title="Delete group"
                        disabled={loading}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{ fontSize: 18 }}
                        />
                      </button>
                    </div>
                  </div>
                ))}

                {localGroups.length === 0 && (
                  <div className={styles.emptyGroups}>
                    <FontAwesomeIcon
                      icon={faUsers}
                      style={{ fontSize: 48, color: '#ccc' }}
                    />
                    <p>No groups yet</p>
                    <p className={styles.emptySubtext}>
                      Create groups to organize your friends
                    </p>
                  </div>
                )}
              </div>

              <button
                className={styles.createGroupButton}
                type="button"
                onClick={() => setShowCreateForm(true)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 20 }} />
                Create New Group
              </button>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.footerButton}
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.footerButtonPrimary}
            onClick={handleSaveAndClose}
            type="button"
            disabled={loading}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendGroupsModal;
