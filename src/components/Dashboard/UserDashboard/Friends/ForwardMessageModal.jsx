// src/components/Dashboard/UserDashboard/Friends/ForwardMessageModal.jsx
import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../../../../utils/api';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCheck,
  faShare
} from '@fortawesome/free-solid-svg-icons';

const ForwardMessageModal = ({ message, onClose }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      if (response.success) {
        const enrichedFriends = response.data.map(friend => ({
          id: friend._id,
          name: `${friend.prenom} ${friend.nom}`,
          avatar: friend.photo_profil
        }));
        setFriends(enrichedFriends);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleForward = async () => {
    if (selectedFriends.length === 0) return;

    setSending(true);
    try {
      await friendsAPI.forwardMessage(message.id, selectedFriends);
      onClose();
    } catch (err) {
      console.error('Error forwarding message:', err);
      alert('Failed to forward message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FontAwesomeIcon icon={faShare} style={{ fontSize: 24 }} />
            Forward Message
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Message Preview */}
          <div className={styles.forwardMessagePreview}>
            <p className={styles.forwardPreviewLabel}>Message:</p>
            <div className={styles.forwardPreviewContent}>
              {message.text.substring(0, 100)}
              {message.text.length > 100 && '...'}
            </div>
          </div>

          {/* Friends List */}
          <p className={styles.forwardLabel}>
            Select friends ({selectedFriends.length} selected)
          </p>
          
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <div className={styles.forwardFriendsList}>
              {friends.map(friend => (
                <label key={friend.id} className={styles.forwardFriendItem}>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
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
                  {selectedFriends.includes(friend.id) && (
                    <FontAwesomeIcon 
                      icon={faCheck} 
                      style={{ 
                        fontSize: 16, 
                        color: '#10b981', 
                        marginLeft: 'auto' 
                      }} 
                    />
                  )}
                </label>
              ))}

              {friends.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No friends available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.footerButton} onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button 
            className={styles.footerButtonPrimary} 
            onClick={handleForward}
            disabled={selectedFriends.length === 0 || sending}
          >
            {sending ? 'Sending...' : `Forward to ${selectedFriends.length} ${selectedFriends.length === 1 ? 'friend' : 'friends'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;