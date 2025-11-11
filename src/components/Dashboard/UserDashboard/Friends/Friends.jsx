import React, { useState, useEffect } from 'react';
import FriendCard from './FriendCard';
import RequestCard from './RequestCard';
import SuggestionCard from './SuggestionCard';
import FriendGroupsModal from './FriendGroupsModal';
import ChatModal from './ChatModal';
import FriendProfileModal from './FriendProfileModal';
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

  // NEW: profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileFriend, setSelectedProfileFriend] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);

  // ✅ FONCTION POUR CONVERTIR LES CHEMINS RELATIFS EN URLs ABSOLUES
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    
    // Assurez-vous que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Utiliser l'URL complète du backend
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
      setError('Erreur lors du chargement des données');
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
          avatar: getImageUrl(friend.photo_profil), // ✅ CONVERTI EN URL COMPLÈTE
          status: isUserOnline(friend._id) ? 'online' : 'offline',
          mutualFriends: 0,
          location: friend.ville || 'Unknown',
          favoriteGenres: [],
          lastActive: isUserOnline(friend._id) ? 'Active now' : '2 hours ago',
          bio: friend.bio || ''
        }));
        setFriends(enrichedFriends);
      } else {
        console.warn('Failed to load friends:', response.message);
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
          avatar: getImageUrl(req.photo_profil || req.avatar), // ✅ CONVERTI EN URL COMPLÈTE
          mutualFriends: 0,
          location: req.ville || 'Unknown',
          date: formatDate(req.requestDate || req.created_date),
          favoriteGenres: []
        }));
        setRequests(enrichedRequests);
      } else {
        console.warn('Failed to load friend requests:', response.message);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await friendsAPI.getFriendSuggestions();
      if (response.success) {
        const enrichedSuggestions = response.data.map(sug => ({
          id: sug._id,
          name: `${sug.prenom} ${sug.nom}`,
          username: `@${sug.email.split('@')[0]}`,
          avatar: getImageUrl(sug.photo_profil), // ✅ CONVERTI EN URL COMPLÈTE
          mutualFriends: 0,
          location: sug.ville || 'Unknown',
          reason: sug.reason || 'Suggested for you',
          favoriteGenres: []
        }));
        setSuggestions(enrichedSuggestions);
      } else {
        console.warn('Failed to load suggestions:', response.message);
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
          color: group.color || '#b31217'
        }));
        setFriendGroups(mappedGroups);
      } else {
        console.warn('Failed to load friend groups:', response.message);
      }
    } catch (err) {
      console.error('Error loading friend groups:', err);
    }
  };

  // Actions
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
        alert('Friend request accepted!');
      } else {
        const failedRequest = requests.find(r => r.id === friendshipId);
        if (failedRequest) {
          setRequests(prev => prev.filter(r => r.id !== friendshipId));
          setFriends(prev => [...prev, {
            ...failedRequest, status: 'offline', lastActive: 'Recently'
          }]);
        }
        alert('Friend request accepted! (Server sync may be pending)');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      const req = requests.find(r => r.id === friendshipId);
      if (req) {
        setRequests(prev => prev.filter(r => r.id !== friendshipId));
        setFriends(prev => [...prev, { ...req, status: 'offline', lastActive: 'Recently' }]);
        alert('Friend request accepted! (UI updated, server sync pending)');
      } else {
        alert('Error accepting friend request. Please try again.');
      }
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      const response = await friendsAPI.rejectFriendRequest(friendshipId);
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
      if (!response.success) {
        console.warn('API reported failure but UI updated:', response.message);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await friendsAPI.sendFriendRequest(userId);
      const suggestion = suggestions.find(s => s.id === userId);
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      if (suggestion && user) {
        try { notifyFriendRequest(userId, `${user.prenom} ${user.nom}`); } catch {}
      }
      if (!response.success) console.warn('API reported failure but UI updated:', response.message);
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Error sending friend request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to unfriend this person?')) {
      try {
        const response = await friendsAPI.removeFriend(friendId);
        setFriends(prev => prev.filter(f => f.id !== friendId));
        if (!response.success) console.warn('API reported failure but UI updated:', response.message);
      } catch (err) {
        console.error('Error removing friend:', err);
        setFriends(prev => prev.filter(f => f.id !== friendId));
      }
    }
  };

  const handleSendMessage = (friend) => {
    setSelectedChatFriend(friend);
    setShowChatModal(true);
  };

  // NEW: open profile modal (with optional fetch if not in local list)
  const handleViewProfile = async (friendId) => {
    let f = friends.find(x => x.id === friendId);

    if (!f && friendsAPI?.getFriendById) {
      try {
        const res = await friendsAPI.getFriendById(friendId);
        if (res?.success && res?.data) {
          f = {
            id: res.data._id,
            name: `${res.data.prenom} ${res.data.nom}`,
            username: `@${res.data.email?.split('@')[0]}`,
            avatar: getImageUrl(res.data.photo_profil), // ✅ CONVERTI EN URL COMPLÈTE
            status: isUserOnline(res.data._id) ? 'online' : 'offline',
            mutualFriends: 0,
            location: res.data.ville || 'Unknown',
            favoriteGenres: res.data.favoriteGenres || [],
            lastActive: isUserOnline(res.data._id) ? 'Active now' : 'Recently',
            bio: res.data.bio || ''
          };
        }
      } catch (e) {
        console.warn('getFriendById failed, using minimal profile');
      }
    }

    if (!f) f = { id: friendId, name: 'Friend', username: '@user', status: 'offline' };

    setSelectedProfileFriend(f);
    setShowProfileModal(true);
  };

  const handleSaveGroups = async (updatedGroups) => {
    try {
      let success = true;
      const existingIds = friendGroups.map(g => g.id);
      const newGroups = updatedGroups.filter(g => !existingIds.includes(g.id));
      const deletedGroups = friendGroups.filter(g => !updatedGroups.find(ug => ug.id === g.id));
      const modifiedGroups = updatedGroups.filter(g => 
        existingIds.includes(g.id) && 
        JSON.stringify(g) !== JSON.stringify(friendGroups.find(eg => eg.id === g.id))
      );
      
      for (const newGroup of newGroups) {
        try { await friendsAPI.createFriendGroup({ name: newGroup.name, members: newGroup.members, color: newGroup.color }); }
        catch { success = false; }
      }
      for (const group of modifiedGroups) {
        try { await friendsAPI.updateFriendGroup(group.id, { name: group.name, members: group.members, color: group.color }); }
        catch { success = false; }
      }
      for (const group of deletedGroups) {
        try { await friendsAPI.deleteFriendGroup(group.id); }
        catch { success = false; }
      }
      setFriendGroups(updatedGroups);
      if (!success) alert('Groups updated with some errors. UI updated, some server changes may be pending.');
      else alert('Groups updated successfully!');
    } catch (err) {
      console.error('Error saving groups:', err);
      setFriendGroups(updatedGroups);
      alert('Groups updated with errors. UI updated, server sync may be pending.');
    }
  };

  // Utils
  const formatDate = (date) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         friend.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || friend.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'friends', label: 'My Friends', count: friends.length, icon: faUsers },
    { id: 'requests', label: 'Requests', count: requests.length, icon: faUserPlus },
    { id: 'suggestions', label: 'Suggestions', count: suggestions.length, icon: faUserCheck }
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
        />
      )}

      {showChatModal && selectedChatFriend && (
        <ChatModal
          friend={selectedChatFriend}
          onClose={() => {
            setShowChatModal(false);
            setSelectedChatFriend(null);
          }}
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
    </div>
  );
};

export default Friends;