// src/components/Dashboard/UserDashboard/Friends/Friends.jsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Search, Filter, MessageCircle, UsersRound } from 'lucide-react';
import FriendCard from './FriendCard';
import RequestCard from './RequestCard';
import SuggestionCard from './SuggestionCard';
import FriendGroupsModal from './FriendGroupsModal';
import ChatModal from './ChatModal';
import friendsService from '../../../../services/friendsService';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Friends.module.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les données
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    loadAllData();
  }, []);

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
      const response = await friendsService.getFriends();
      if (response.success) {
        // Enrichir avec le statut en ligne
        const enrichedFriends = response.data.map(friend => ({
          id: friend._id,
          name: `${friend.prenom} ${friend.nom}`,
          username: `@${friend.email.split('@')[0]}`,
          avatar: friend.photo_profil || '',
          status: isUserOnline(friend._id) ? 'online' : 'offline',
          mutualFriends: 0, // À implémenter
          location: friend.ville || 'Unknown',
          favoriteGenres: [], // À implémenter
          lastActive: isUserOnline(friend._id) ? 'Active now' : '2 hours ago'
        }));
        setFriends(enrichedFriends);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await friendsService.getFriendRequests();
      if (response.success) {
        const enrichedRequests = response.data.map(req => ({
          id: req._id || req.friendshipId,
          name: req.nom ? `${req.prenom} ${req.nom}` : req.name,
          username: req.email ? `@${req.email.split('@')[0]}` : req.username,
          avatar: req.photo_profil || req.avatar || '',
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
      const response = await friendsService.getFriendSuggestions();
      if (response.success) {
        const enrichedSuggestions = response.data.map(sug => ({
          id: sug._id,
          name: `${sug.prenom} ${sug.nom}`,
          username: `@${sug.email.split('@')[0]}`,
          avatar: sug.photo_profil || '',
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
      const response = await friendsService.getFriendGroups();
      if (response.success) {
        const mappedGroups = response.data.map(group => ({
          id: group._id,
          name: group.name,
          members: group.members.map(m => m._id),
          color: group.color || '#b31217'
        }));
        setFriendGroups(mappedGroups);
      }
    } catch (err) {
      console.error('Error loading friend groups:', err);
    }
  };

  // Handlers
  const handleAcceptRequest = async (friendshipId) => {
    try {
      const response = await friendsService.acceptFriendRequest(friendshipId);
      if (response.success) {
        // Supprimer de la liste des demandes
        const acceptedRequest = requests.find(r => r.id === friendshipId);
        setRequests(requests.filter(r => r.id !== friendshipId));
        
        // Ajouter aux amis
        if (acceptedRequest) {
          const newFriend = {
            ...acceptedRequest,
            status: 'online',
            lastActive: 'Active now'
          };
          setFriends([...friends, newFriend]);
        }
        
        // Notifier via Socket.IO
        const request = requests.find(r => r.id === friendshipId);
        if (request) {
          notifyFriendRequestAccepted(request.id);
        }
        
        alert('Friend request accepted!');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Error accepting friend request');
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      const response = await friendsService.rejectFriendRequest(friendshipId);
      if (response.success) {
        setRequests(requests.filter(r => r.id !== friendshipId));
        alert('Friend request rejected');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Error rejecting friend request');
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await friendsService.sendFriendRequest(userId);
      if (response.success) {
        const suggestion = suggestions.find(s => s.id === userId);
        setSuggestions(suggestions.filter(s => s.id !== userId));
        
        // Notifier via Socket.IO
        if (suggestion && user) {
          notifyFriendRequest(userId, `${user.prenom} ${user.nom}`);
        }
        
        alert('Friend request sent!');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Error sending friend request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to unfriend this person?')) {
      try {
        const response = await friendsService.removeFriend(friendId);
        if (response.success) {
          setFriends(friends.filter(f => f.id !== friendId));
          alert('Friend removed');
        }
      } catch (err) {
        console.error('Error removing friend:', err);
        alert('Error removing friend');
      }
    }
  };

  const handleSendMessage = (friend) => {
    setSelectedChatFriend(friend);
    setShowChatModal(true);
  };

  const handleViewProfile = (friendId) => {
    console.log('View profile:', friendId);
    // Navigation vers le profil
  };

  const handleSaveGroups = async (updatedGroups) => {
    try {
      // Logique pour sauvegarder les groupes via l'API
      setFriendGroups(updatedGroups);
      alert('Groups updated successfully!');
    } catch (err) {
      console.error('Error saving groups:', err);
      alert('Error saving groups');
    }
  };

  // Fonction utilitaire pour formater les dates
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
    { id: 'friends', label: 'My Friends', count: friends.length, icon: Users },
    { id: 'requests', label: 'Requests', count: requests.length, icon: UserPlus },
    { id: 'suggestions', label: 'Suggestions', count: suggestions.length, icon: UserCheck }
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
              <Users size={32} />
              Friends
            </h1>
            <p className={styles.subtitle}>Connect with people who love the same throwback music</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.groupsButton}
              onClick={() => setShowGroupsModal(true)}
            >
              <UsersRound size={20} />
              Groups ({friendGroups.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            >
              <Icon size={20} />
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.badge}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter */}
      {activeTab === 'friends' && (
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <Search size={20} />
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
              <Filter size={20} />
              <span>Filter</span>
            </button>
            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <button 
                  onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }} 
                  className={styles.filterOption}
                >
                  All Friends
                </button>
                <button 
                  onClick={() => { setFilterStatus('online'); setShowFilterMenu(false); }} 
                  className={styles.filterOption}
                >
                  Online Only
                </button>
                <button 
                  onClick={() => { setFilterStatus('offline'); setShowFilterMenu(false); }} 
                  className={styles.filterOption}
                >
                  Offline
                </button>
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
                <Users size={64} />
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
                <UserPlus size={64} />
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
                <UserCheck size={64} />
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
    </div>
  );
};

export default Friends;