// src/components/Dashboard/UserDashboard/Chat/GroupChatModal.jsx
import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../../../../utils/api';
import CustomModal from './CustomModal';
import styles from './Chat.module.css';

const GroupChatModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: ''
  });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    } else {
      setGroupName('');
      setSelectedFriends([]);
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await friendsAPI.getFriends();
      if (res.success && Array.isArray(res.data)) {
        setFriends(res.data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load friends list'
      });
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setErrorModal({
        isOpen: true,
        message: 'Please enter a group name'
      });
      return;
    }

    if (selectedFriends.length === 0) {
      setErrorModal({
        isOpen: true,
        message: 'Please select at least one friend'
      });
      return;
    }

    try {
      setProcessing(true);
      
      console.log('🚀 Starting group creation...');
      console.log('📝 Group name:', groupName.trim());
      console.log('👥 Selected friends IDs:', selectedFriends);
      console.log('🔢 Number of friends:', selectedFriends.length);
      
      // Essayer différents formats
      const requestData = {
        groupName: groupName.trim(),
        name: groupName.trim(),
        members: selectedFriends,
        memberIds: selectedFriends
      };
      
      console.log('📦 Request data:', JSON.stringify(requestData, null, 2));
      
      const res = await friendsAPI.createFriendGroup(requestData);

      console.log('✅ Response received:', res);

      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'Group created successfully!'
        });

        setTimeout(() => {
          if (res.data) {
            console.log('🎉 Group created:', res.data);
            onGroupCreated && onGroupCreated(res.data);
          }
          onClose();
        }, 1500);
      } else {
        console.error('❌ Creation failed:', res);
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to create group'
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('📄 Response:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'An unexpected error occurred';
      
      setErrorModal({
        isOpen: true,
        message: `Error: ${errorMsg}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (prenom, nom) => {
    const text = `${prenom || ''} ${nom || ''}`.trim();
    if (!text) return '';
    return text
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fonction pour obtenir l'URL de l'image correctement
  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    
    const backendUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    
    if (photoPath.startsWith('/uploads')) {
      return `${backendUrl}${photoPath}`;
    }
    
    if (!photoPath.includes('/')) {
      return `${backendUrl}/uploads/profiles/${photoPath}`;
    }
    
    const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${backendUrl}${normalizedPath}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}
        onClick={() => !processing && onClose()}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '480px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>
            Create Group Chat
          </h3>
          <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>
            Create a group to chat with multiple friends
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              disabled={processing}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Select Friends ({selectedFriends.length} selected)
            </label>

            {loadingFriends ? (
              <p style={{ fontSize: '14px', color: '#666' }}>
                Loading friends...
              </p>
            ) : friends.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#666' }}>
                No friends available
              </p>
            ) : (
              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              >
                {friends.map((friend) => {
                  const friendId = friend._id || friend.id;
                  const isSelected = selectedFriends.includes(friendId);
                  const imageUrl = getImageUrl(friend.photo_profil);

                  return (
                    <label
                      key={friendId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        background: isSelected ? '#f0f0f0' : 'transparent'
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#f9f9f9')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isSelected
                          ? '#f0f0f0'
                          : 'transparent')
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFriend(friendId)}
                        disabled={processing}
                        style={{ cursor: 'pointer' }}
                      />

                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: '14px'
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={friend.prenom}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.textContent = getInitials(friend.prenom, friend.nom);
                            }}
                          />
                        ) : (
                          getInitials(friend.prenom, friend.nom)
                        )}
                      </div>

                      <span style={{ fontSize: '14px', flex: 1 }}>
                        {friend.prenom} {friend.nom}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px'
            }}
          >
            <button
              type="button"
              onClick={() => !processing && onClose()}
              disabled={processing}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={processing || !groupName.trim() || selectedFriends.length === 0}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#b31217',
                color: '#fff',
                cursor:
                  processing || !groupName.trim() || selectedFriends.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity:
                  processing || !groupName.trim() || selectedFriends.length === 0
                    ? 0.6
                    : 1
              }}
            >
              {processing ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>

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

export default GroupChatModal;