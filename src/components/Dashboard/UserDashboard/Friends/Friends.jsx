// src/components/Dashboard/UserDashboard/Friends/Friends.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import FriendCard from './FriendCard';
import RequestCard from './RequestCard';
import SuggestionCard from './SuggestionCard';
import FriendGroupsModal from './FriendGroupsModal';
import ChatModal from './ChatModal';
import FriendProfileModal from './FriendProfileModal';
import GroupChatModal from './GroupChatModal';
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

/**
 * Petit modal pour lister les conversations de groupe
 * et permettre d’ouvrir le chat de groupe.
 */
const GroupChatsListModal = ({ groups = [], onClose, onOpenGroupChat }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 24 }} />
            Group Chats
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {groups.length === 0 ? (
            <div className={styles.emptyState}>
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: 48, opacity: 0.4 }} />
              <h3>No group chats</h3>
              <p>You haven’t joined any group chats yet.</p>
            </div>
          ) : (
            <div className={styles.groupsList}>
              {groups.map((group) => (
                <div key={group.id || group._id} className={styles.groupItem}>
                  <div
                    className={styles.groupColor}
                    style={{ backgroundColor: group.color || '#b31217' }}
                  />
                  <div className={styles.groupInfo}>
                    <h4 className={styles.groupName}>{group.name}</h4>
                    <p className={styles.groupMembers}>
                      {group.members?.length || 0} members
                    </p>
                  </div>
                  <div className={styles.groupActions}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => onOpenGroupChat && onOpenGroupChat(group)}
                      title="Open group chat"
                    >
                      <FontAwesomeIcon
                        icon={faMessage}
                        style={{ fontSize: 18, color: '#10b981' }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.footerButton} onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Friends = () => {
  const { user } = useAuth();
  const { isUserOnline, notifyFriendRequest, notifyFriendRequestAccepted } = useSocket();

  const currentUserId = user?._id || user?.id || null;

  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showGroupChatsModal, setShowGroupChatsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileFriend, setSelectedProfileFriend] = useState(null);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });

  // Group chat modal
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);
  const [chatGroups, setChatGroups] = useState([]);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      if (response.success) {
        const enrichedFriends = response.data.map((friend) => ({
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
        const enrichedRequests = response.data.map((req) => ({
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
        // Filtrer pour exclure admin et superadmin (double sécurité avec le backend)
        const filteredSuggestions = response.data.filter((sug) => {
          const userRole = sug.role || (sug.roles && sug.roles[0]?.libelle_role);
          return userRole !== 'admin' && userRole !== 'superadmin';
        });

        const enrichedSuggestions = filteredSuggestions.map((sug) => ({
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
        const mappedGroups = response.data.map((group) => ({
          id: group._id,
          name: group.name,
          members: group.members.map((m) => m._id || m),
          color: group.color || '#b31217',
          isCreator: group.owner === user?.id || group.owner === user?._id
        }));
        setFriendGroups(mappedGroups);
      }
    } catch (err) {
      console.error('Error loading friend groups:', err);
    }
  };

  /**
   * Charger les conversations de groupe auxquelles l’utilisateur participe.
   */
  const loadChatGroups = async () => {
    try {
      if (!currentUserId) return;

      let response;
      if (typeof friendsAPI.getAllConversations === 'function') {
        response = await friendsAPI.getAllConversations();
      } else if (typeof friendsAPI.getConversations === 'function') {
        response = await friendsAPI.getConversations();
      } else {
        console.warn('No getAllConversations/getConversations available on friendsAPI');
        return;
      }

      if (!response?.success) return;

      const conversations = response.data || [];
      const groups = conversations
        .filter((conv) => conv.type === 'group')
        .map((conv) => {
          const participantsRaw = Array.isArray(conv.participants)
            ? conv.participants
            : [];

          const participantIds = participantsRaw
            .map((p) =>
              typeof p === 'string' || typeof p === 'number'
                ? p
                : p._id || p.id || null
            )
            .filter(Boolean);

          const creator =
            conv.groupCreator &&
            (conv.groupCreator._id ||
              conv.groupCreator.id ||
              conv.groupCreator);

          return {
            id: conv._id || conv.id,
            name: conv.groupName || conv.name || 'Group chat',
            members: participantIds,
            color: conv.color || '#b31217',
            conversationId: conv._id || conv.id,
            description: conv.description || '',
            updatedAt: conv.updatedAt || conv.modified_date || conv.createdAt,
            isCreator:
              !!creator &&
              !!currentUserId &&
              String(creator) === String(currentUserId)
          };
        });

      setChatGroups(groups);
    } catch (err) {
      console.error('Error loading chat groups:', err);
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

  const handleAcceptRequest = async (friendshipId) => {
    try {
      const response = await friendsAPI.acceptFriendRequest(friendshipId);
      if (response.success) {
        const acceptedRequest = requests.find((r) => r.id === friendshipId);
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
        if (acceptedRequest) {
          const newFriend = {
            ...acceptedRequest,
            status: 'online',
            lastActive: 'Active now'
          };
          setFriends((prev) => [...prev, newFriend]);
          try {
            notifyFriendRequestAccepted(acceptedRequest.id);
          } catch {}
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
      } else {
        setConfirmModal({
          isOpen: true,
          type: 'error',
          data: {
            title: 'Error',
            message: response.message || 'Failed to accept friend request. Please try again.',
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
        title: 'Decline Friend Request',
        message: 'Are you sure you want to decline this friend request?',
        confirmText: 'Decline',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            const response = await friendsAPI.rejectFriendRequest(friendshipId);
            if (response.success) {
              setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
              setConfirmModal({
                isOpen: true,
                type: 'success',
                data: {
                  title: 'Request Declined',
                  message: 'Friend request declined successfully.',
                  showCancel: false,
                  confirmText: 'OK'
                }
              });
            } else {
              setConfirmModal({
                isOpen: true,
                type: 'error',
                data: {
                  title: 'Error',
                  message: response.message || 'Failed to decline request. Please try again.',
                  showCancel: false,
                  confirmText: 'OK'
                }
              });
            }
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

  // 🔴 ICI : intégration des validations backend sur l’envoi de demande d’ami
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
              // On enlève la suggestion localement
              setSuggestions((prev) => prev.filter((s) => s.id !== userId));

              try {
                notifyFriendRequest(userId, `${user?.prenom} ${user?.nom}`);
              } catch {}

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
            } else {
              // Message renvoyé par le backend (déjà amis, pending, admin, etc.)
              setConfirmModal({
                isOpen: true,
                type: 'error',
                data: {
                  title: 'Cannot Send Request',
                  message: response.message || 'Failed to send friend request.',
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
    const friend = friends.find((f) => f.id === friendId);
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
            setFriends((prev) => prev.filter((f) => f.id !== friendId));

            setConfirmModal({
              isOpen: true,
              type: 'success',
              data: {
                title: 'Friend Removed',
                message: 'The friend has been removed successfully.',
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

  const handleSendMessage = (friendId) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setSelectedChatFriend(friend);
      setShowChatModal(true);
    }
  };

  const handleViewProfile = (friendId) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setSelectedProfileFriend(friend);
      setShowProfileModal(true);
    }
  };

  const handleSaveGroups = async (updatedGroups) => {
    setFriendGroups(updatedGroups);
    await loadFriendGroups();
  };

  const handleOpenGroupChat = (group) => {
    setSelectedGroupChat(group);
    setShowGroupChatModal(true);
  };

  const handleCloseGroupChat = () => {
    setShowGroupChatModal(false);
    setSelectedGroupChat(null);
  };

  const handleGroupUpdated = async () => {
    await Promise.all([loadFriendGroups(), loadChatGroups()]);
  };

  // Filtrer les amis
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || friend.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const myChatGroups = chatGroups.filter((group) =>
    !currentUserId
      ? true
      : Array.isArray(group.members) &&
        group.members.some((id) => String(id) === String(currentUserId))
  );

  const tabs = [
    { id: 'friends', label: 'My Friends', icon: faUsers, count: friends.length },
    { id: 'requests', label: 'Requests', icon: faUserPlus, count: requests.length },
    { id: 'suggestions', label: 'Suggestions', icon: faUserCheck, count: suggestions.length }
  ];

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadFriends(),
          loadRequests(),
          loadSuggestions(),
          loadFriendGroups(),
          loadChatGroups()
        ]);
      } catch (err) {
        console.error('Error loading friends module:', err);
        setError('Failed to load friends data');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centeredContent}>
          <div className={styles.spinner}></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.centeredContent}>
          <p className={styles.error}>❌ {error}</p>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setError(null);
              setLoading(true);
              Promise.all([
                loadFriends(),
                loadRequests(),
                loadSuggestions(),
                loadFriendGroups(),
                loadChatGroups()
              ]).finally(() => setLoading(false));
            }}
          >
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
        <div>
          <h1 className={styles.title}>Friends</h1>
          <p className={styles.subtitle}>Manage your social circle and discover new friends.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowUserSearchModal(true)}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 16 }} />
            Find Friends
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowGroupsModal(true)}
          >
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 16 }} />
            Friend Groups
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowGroupChatsModal(true)}
          >
            <FontAwesomeIcon icon={faMessage} style={{ fontSize: 16 }} />
            Group Chats
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Friends</span>
          <span className={styles.statValue}>{friends.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Requests</span>
          <span className={styles.statValue}>{requests.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Suggestions</span>
          <span className={styles.statValue}>{suggestions.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 16 }} />
            <span>{tab.label}</span>
            <span className={styles.tabBadge}>{tab.count}</span>
          </button>
        ))}

        <div className={styles.filterWrapper}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilterMenu((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faFilter} style={{ fontSize: 14 }} />
            Filter
          </button>
          {showFilterMenu && (
            <div className={styles.filterMenu}>
              <button
                className={filterStatus === 'all' ? styles.filterOptionActive : styles.filterOption}
                onClick={() => {
                  setFilterStatus('all');
                  setShowFilterMenu(false);
                }}
              >
                All
              </button>
              <button
                className={
                  filterStatus === 'online' ? styles.filterOptionActive : styles.filterOption
                }
                onClick={() => {
                  setFilterStatus('online');
                  setShowFilterMenu(false);
                }}
              >
                Online
              </button>
              <button
                className={
                  filterStatus === 'offline' ? styles.filterOptionActive : styles.filterOption
                }
                onClick={() => {
                  setFilterStatus('offline');
                  setShowFilterMenu(false);
                }}
              >
                Offline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
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
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'friends' && (
          <div className={styles.grid}>
            {filteredFriends.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No friends found</h3>
                <p>Try adjusting your search or add new friends.</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onRemove={handleRemoveFriend}
                  onMessage={handleSendMessage}
                  onViewProfile={handleViewProfile}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className={styles.grid}>
            {requests.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No pending requests</h3>
                <p>You don’t have any friend requests at the moment.</p>
              </div>
            ) : (
              requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className={styles.grid}>
            {suggestions.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No suggestions</h3>
                <p>We couldn’t find any suggestions for now.</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAdd={handleAddFriend}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showGroupsModal && (
        <FriendGroupsModal
          groups={friendGroups}
          friends={friends}
          onClose={() => setShowGroupsModal(false)}
          onSave={handleSaveGroups}
          onOpenGroupChat={handleOpenGroupChat}
        />
      )}

      {showGroupChatsModal && (
        <GroupChatsListModal
          groups={myChatGroups}
          onClose={() => setShowGroupChatsModal(false)}
          onOpenGroupChat={(group) => {
            setShowGroupChatsModal(false);
            handleOpenGroupChat(group);
          }}
        />
      )}

      {showGroupChatModal && selectedGroupChat && (
        <GroupChatModal
          group={selectedGroupChat}
          friends={friends}          // on passe la liste des amis
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
