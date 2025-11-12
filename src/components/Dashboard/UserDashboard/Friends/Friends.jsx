// src/components/Dashboard/UserDashboard/Friends/Friends.jsx - VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect } from 'react';
import FriendCard from './FriendCard';
import RequestCard from './RequestCard';
import SuggestionCard from './SuggestionCard';
import FriendGroupsModal from './FriendGroupsModal';
import ChatModal from './ChatModal';
import FriendProfileModal from './FriendProfileModal';
import GroupChatModal from './GroupChatModal'; // ✅ AJOUT
import UserSearchModal from './UserSearchModal';
import ConfirmModal from './ConfirmModal';
import { friendsAPI } from '../../../../utils/api';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faUserCheck,
  faMagnifyingGlass,
  faFilter,
  faMessage
} from '@fortawesome/free-solid-svg-icons';

const Friends = () => {
  const { user } = useAuth();
  const { isUserOnline, notifyFriendRequest, notifyFriendRequestAccepted } = useSocket();
  
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileFriend, setSelectedProfileFriend] = useState(null);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
  
  // ✅ AJOUT: States pour GroupChatModal
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadFriends(),
        loadRequests(),
        loadSuggestions(),
        loadFriendGroups()
      ]);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      if (response.success) {
        const enrichedFriends = response.data.map(friend => ({
          id: friend._id,
          name: `${friend.prenom} ${friend.nom}`,
          username: `@${friend.email.split('@')[0]}`,
          avatar: getImageUrl(friend.photo_profil),
          status: isUserOnline(friend._id) ? 'online' : 'offline',
          mutualFriends: 0,
          location: friend.ville || 'Unknown',
          favoriteGenres: [],
          lastActive: isUserOnline(friend._id) ? 'Active now' : '2 hours ago',
          bio: friend.bio || ''
        }));
        setFriends(enrichedFriends);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await friendsAPI.getFriendRequests();
      if (response.success) {
        const enrichedRequests = response.data.map(req => ({
          id: req._id || req.friendshipId,
          name: req.nom ? `${req.prenom} ${req.nom}` : req.name,
          username: req.email ? `@${req.email.split('@')[0]}` : req.username,
          avatar: getImageUrl(req.photo_profil || req.avatar),
          mutualFriends: 0,
          location: req.ville || 'Unknown',
          date: formatDate(req.requestDate || req.created_date),
          favoriteGenres: []
        }));
        setRequests(enrichedRequests);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await friendsAPI.getFriendSuggestions();
      if (response.success) {
        // Filtrer pour exclure admin et superadmin
        const filteredSuggestions = response.data.filter(sug => {
          const userRole = sug.role || (sug.roles && sug.roles[0]?.libelle_role);
          return userRole !== 'admin' && userRole !== 'superadmin';
        });

        const enrichedSuggestions = filteredSuggestions.map(sug => ({
          id: sug._id,
          name: `${sug.prenom} ${sug.nom}`,
          username: `@${sug.email.split('@')[0]}`,
          avatar: getImageUrl(sug.photo_profil),
          mutualFriends: 0,
          location: sug.ville || 'Unknown',
          reason: sug.reason || 'Suggested for you',
          favoriteGenres: []
        }));
        setSuggestions(enrichedSuggestions);
      }
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  const loadFriendGroups = async () => {
    try {
      const response = await friendsAPI.getFriendGroups();
      if (response.success) {
        const mappedGroups = response.data.map(group => ({
          id: group._id,
          name: group.name,
          members: group.members.map(m => m._id || m),
          color: group.color || '#b31217',
          isCreator: group.owner === user?.id || group.owner === user?._id
        }));
        setFriendGroups(mappedGroups);
      }
    } catch (err) {
      console.error('Error loading friend groups:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Actions avec modals de confirmation
  const handleAcceptRequest = async (friendshipId) => {
    try {
      const response = await friendsAPI.acceptFriendRequest(friendshipId);
      if (response.success) {
        const acceptedRequest = requests.find(r => r.id === friendshipId);
        setRequests(prev => prev.filter(r => r.id !== friendshipId));
        if (acceptedRequest) {
          const newFriend = {
            ...acceptedRequest,
            status: 'online',
            lastActive: 'Active now'
          };
          setFriends(prev => [...prev, newFriend]);
          try { notifyFriendRequestAccepted(acceptedRequest.id); } catch {}
        } else {
          loadFriends();
        }
        setConfirmModal({
          isOpen: true,
          type: 'success',
          data: {
            title: 'Friend Request Accepted',
            message: 'You are now friends! You can start chatting.',
            showCancel: false,
            confirmText: 'OK'
          }
        });
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Error',
          message: 'Failed to accept friend request. Please try again.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Reject Friend Request',
        message: 'Are you sure you want to decline this friend request?',
        confirmText: 'Decline',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await friendsAPI.rejectFriendRequest(friendshipId);
            setRequests(prev => prev.filter(r => r.id !== friendshipId));
            setConfirmModal({
              isOpen: true,
              type: 'success',
              data: {
                title: 'Request Declined',
                message: 'Friend request has been declined.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          } catch (err) {
            console.error('Error rejecting request:', err);
            setConfirmModal({
              isOpen: true,
              type: 'error',
              data: {
                title: 'Error',
                message: 'Failed to decline request. Please try again.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          }
        }
      }
    });
  };

  const handleAddFriend = async (userId) => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      data: {
        title: 'Send Friend Request',
        message: 'Send a friend request to this user?',
        confirmText: 'Send Request',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            const response = await friendsAPI.sendFriendRequest(userId);
            if (response.success) {
              setSuggestions(prev => prev.filter(s => s.id !== userId));
              try { notifyFriendRequest(userId, `${user?.prenom} ${user?.nom}`); } catch {}
              setConfirmModal({
                isOpen: true,
                type: 'success',
                data: {
                  title: 'Request Sent',
                  message: 'Friend request sent successfully!',
                  showCancel: false,
                  confirmText: 'OK'
                }
              });
            }
          } catch (err) {
            console.error('Error sending friend request:', err);
            setConfirmModal({
              isOpen: true,
              type: 'error',
              data: {
                title: 'Error',
                message: 'Failed to send friend request. Please try again.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          }
        }
      }
    });
  };

  const handleRemoveFriend = async (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Remove Friend',
        message: `Are you sure you want to remove ${friend?.name || 'this user'} from your friends?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await friendsAPI.removeFriend(friendId);
            setFriends(prev => prev.filter(f => f.id !== friendId));
            setConfirmModal({
              isOpen: true,
              type: 'success',
              data: {
                title: 'Friend Removed',
                message: 'Friend has been removed from your list.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          } catch (err) {
            console.error('Error removing friend:', err);
            setConfirmModal({
              isOpen: true,
              type: 'error',
              data: {
                title: 'Error',
                message: 'Failed to remove friend. Please try again.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          }
        }
      }
    });
  };

  const handleSendMessage = (friend) => {
    setSelectedChatFriend(friend);
    setShowChatModal(true);
  };

  const handleViewProfile = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      setSelectedProfileFriend(friend);
      setShowProfileModal(true);
    }
  };

  const handleSaveGroups = async (updatedGroups) => {
    // Les groupes sont déjà sauvegardés via l'API dans FriendGroupsModal
    // On recharge simplement pour avoir les données à jour
    await loadFriendGroups();
  };

  // ✅ AJOUT: Fonction pour ouvrir le chat de groupe
  const handleOpenGroupChat = (group) => {
    console.log('Opening group chat:', group);
    setSelectedGroupChat(group);
    setShowGroupChatModal(true);
    setShowGroupsModal(false); // Fermer le modal de groupes
  };

  // ✅ AJOUT: Fonction pour fermer le chat de groupe
  const handleCloseGroupChat = () => {
    setShowGroupChatModal(false);
    setSelectedGroupChat(null);
  };

  // ✅ AJOUT: Fonction pour mettre à jour le groupe après modifications
  const handleGroupUpdated = async () => {
    await loadFriendGroups();
  };

  // Filtrer les amis selon le terme de recherche et le filtre de statut
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         friend.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || friend.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Tabs configuration
  const tabs = [
    { id: 'friends', label: 'My Friends', icon: faUsers, count: friends.length },
    { id: 'requests', label: 'Requests', icon: faUserPlus, count: requests.length },
    { id: 'suggestions', label: 'Suggestions', icon: faUserCheck, count: suggestions.length }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={loadAllData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: 32 }} />
              Friends
            </h1>
            <p className={styles.subtitle}>Connect with people who love the same throwback music</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.groupsButton}
              onClick={() => setShowGroupsModal(true)}
            >
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: 20 }} />
              Groups ({friendGroups.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
          >
            <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 20 }} />
            <span className={styles.tabLabel}>{tab.label}</span>
            <span className={styles.badge}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      {activeTab === 'friends' && (
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 20 }} />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.filterWrapper}>
            <button 
              className={styles.filterButton}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FontAwesomeIcon icon={faFilter} style={{ fontSize: 20 }} />
              <span>Filter</span>
            </button>
            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <button onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }} className={styles.filterOption}>All Friends</button>
                <button onClick={() => { setFilterStatus('online'); setShowFilterMenu(false); }} className={styles.filterOption}>Online Only</button>
                <button onClick={() => { setFilterStatus('offline'); setShowFilterMenu(false); }} className={styles.filterOption}>Offline</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions Search Bar */}
      {activeTab === 'suggestions' && (
        <div className={styles.searchBar}>
          <button 
            className={styles.searchUsersButton}
            onClick={() => setShowUserSearchModal(true)}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 20 }} />
            Search Users to Add as Friends
          </button>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'friends' && (
          <>
            {filteredFriends.length > 0 ? (
              <div className={styles.grid}>
                {filteredFriends.map(friend => (
                  <FriendCard 
                    key={friend.id}
                    friend={friend}
                    onRemove={handleRemoveFriend}
                    onMessage={handleSendMessage}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faUsers} style={{ fontSize: 64, opacity: 0.5 }} />
                <h3>No friends found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            {requests.length > 0 ? (
              <div className={styles.list}>
                {requests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 64, opacity: 0.5 }} />
                <h3>No friend requests</h3>
                <p>You're all caught up!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'suggestions' && (
          <>
            {suggestions.length > 0 ? (
              <div className={styles.grid}>
                {suggestions.map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAdd={handleAddFriend}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faUserCheck} style={{ fontSize: 64, opacity: 0.5 }} />
                <h3>No suggestions</h3>
                <p>We'll suggest friends based on your interests</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showGroupsModal && (
        <FriendGroupsModal
          groups={friendGroups}
          friends={friends}
          onClose={() => setShowGroupsModal(false)}
          onSave={handleSaveGroups}
          onOpenGroupChat={handleOpenGroupChat} // ✅ AJOUT
        />
      )}

      {/* ✅ AJOUT: GroupChatModal */}
      {showGroupChatModal && selectedGroupChat && (
        <GroupChatModal
          group={selectedGroupChat}
          onClose={handleCloseGroupChat}
          onUpdateGroup={handleGroupUpdated}
        />
      )}

      {showChatModal && selectedChatFriend && (
        <ChatModal
          friend={selectedChatFriend}
          onClose={() => {
            setShowChatModal(false);
            setSelectedChatFriend(null);
          }}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {showProfileModal && selectedProfileFriend && (
        <FriendProfileModal
          friend={selectedProfileFriend}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfileFriend(null);
          }}
          onMessage={handleSendMessage}
          onRemove={handleRemoveFriend}
        />
      )}

      {showUserSearchModal && (
        <UserSearchModal
          onClose={() => setShowUserSearchModal(false)}
          onSendRequest={handleAddFriend}
          currentUser={user}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', data: null })}
        onConfirm={confirmModal.data?.onConfirm}
        title={confirmModal.data?.title || ''}
        message={confirmModal.data?.message || ''}
        type={confirmModal.type}
        confirmText={confirmModal.data?.confirmText || 'Confirm'}
        cancelText={confirmModal.data?.cancelText || 'Cancel'}
        showCancel={confirmModal.data?.showCancel !== false}
      />
    </div>
  );
};

export default Friends;