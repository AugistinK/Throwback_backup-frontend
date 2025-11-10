// src/components/Dashboard/UserDashboard/Friends/FriendGroupsModal.jsx
import React, { useState } from 'react';
import styles from './Friends.module.css';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPlus,
  faPen,
  faTrash,
  faUsers,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

const FriendGroupsModal = ({ groups, friends, onClose, onSave }) => {
  const [localGroups, setLocalGroups] = useState(groups);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#b31217');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const colors = [
    '#b31217', '#3b82f6', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedMembers.length > 0) {
      const newGroup = {
        id: Date.now(),
        name: newGroupName,
        members: selectedMembers,
        color: selectedColor
      };
      setLocalGroups([...localGroups, newGroup]);
      resetForm();
    }
  };

  const handleUpdateGroup = () => {
    if (editingGroup && newGroupName.trim()) {
      setLocalGroups(localGroups.map(g => 
        g.id === editingGroup.id 
          ? { ...g, name: newGroupName, color: selectedColor, members: selectedMembers }
          : g
      ));
      resetForm();
    }
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm('Delete this group?')) {
      setLocalGroups(localGroups.filter(g => g.id !== groupId));
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setSelectedColor(group.color);
    setSelectedMembers(group.members);
    setShowCreateForm(true);
  };

  const toggleMember = (friendId) => {
    setSelectedMembers(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
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

  const handleSave = () => {
    onSave(localGroups);
    onClose();
  };

  const getMemberNames = (memberIds) => {
    return memberIds
      .map(id => friends.find(f => f.id === id)?.name)
      .filter(Boolean)
      .join(', ');
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
          {/* Create/Edit Form */}
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
                  {colors.map(color => (
                    <button
                      key={color}
                      className={styles.colorOption}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 16, color: 'white' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Select Members ({selectedMembers.length})</label>
                <div className={styles.membersList}>
                  {friends.map(friend => (
                    <label key={friend.id} className={styles.memberItem}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(friend.id)}
                        onChange={() => toggleMember(friend.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.miniAvatar}>
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} />
                        ) : (
                          <div className={styles.miniAvatarPlaceholder}>
                            {getInitials(friend.name)}
                          </div>
                        )}
                      </div>
                      <span>{friend.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.cancelButton} onClick={resetForm}>
                  Cancel
                </button>
                <button 
                  className={styles.saveButton} 
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  disabled={!newGroupName.trim() || selectedMembers.length === 0}
                >
                  {editingGroup ? 'Update' : 'Create'} Group
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Groups List */}
              <div className={styles.groupsList}>
                {localGroups.map(group => (
                  <div key={group.id} className={styles.groupItem}>
                    <div 
                      className={styles.groupColor} 
                      style={{ backgroundColor: group.color }}
                    />
                    <div className={styles.groupInfo}>
                      <h4 className={styles.groupName}>{group.name}</h4>
                      <p className={styles.groupMembers}>
                        {group.members.length} members: {getMemberNames(group.members)}
                      </p>
                    </div>
                    <div className={styles.groupActions}>
                      <button 
                        className={styles.iconButton}
                        onClick={() => handleEditGroup(group)}
                        title="Edit group"
                      >
                        <FontAwesomeIcon icon={faPen} style={{ fontSize: 18 }} />
                      </button>
                      <button 
                        className={`${styles.iconButton} ${styles.dangerButton}`}
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Delete group"
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>
                ))}

                {localGroups.length === 0 && (
                  <div className={styles.emptyGroups}>
                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: 48, color: '#ccc' }} />
                    <p>No groups yet</p>
                    <p className={styles.emptySubtext}>Create groups to organize your friends</p>
                  </div>
                )}
              </div>

              <button 
                className={styles.createGroupButton}
                onClick={() => setShowCreateForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 20 }} />
                Create New Group
              </button>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.footerButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.footerButtonPrimary} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendGroupsModal;
