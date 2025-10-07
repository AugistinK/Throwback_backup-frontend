// src/components/Dashboard/UserDashboard/Friends/Friends.jsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Search, Filter, MessageCircle, UsersRound } from 'lucide-react';
import FriendCard from './FriendCard';
import RequestCard from './RequestCard';
import SuggestionCard from './SuggestionCard';
import FriendGroupsModal from './FriendGroupsModal';
import ChatModal from './ChatModal';
import styles from './Friends.module.css';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState(null);
  
  // États pour les données
  const [friends, setFriends] = useState([
    { 
      id: 1, 
      name: 'Marie Moreau', 
      username: '@mariemoreau', 
      avatar: '', 
      status: 'online', 
      mutualFriends: 12, 
      location: 'Toulouse',
      favoriteGenres: ['Rock', 'Jazz'],
      lastActive: 'Active now'
    },
    { 
      id: 2, 
      name: 'Aicha SARR', 
      username: '@aichasarr', 
      avatar: '', 
      status: 'online', 
      mutualFriends: 8, 
      location: 'Dakar',
      favoriteGenres: ['R&B', 'Soul'],
      lastActive: 'Active now'
    },
    { 
      id: 3, 
      name: 'Ndeye Soukeye Youm', 
      username: '@ndeyeyoum', 
      avatar: '', 
      status: 'offline', 
      mutualFriends: 5, 
      location: 'Paris',
      favoriteGenres: ['Pop', 'Disco'],
      lastActive: '2 hours ago'
    },
    { 
      id: 4, 
      name: 'Jean Dupont', 
      username: '@jeandupont', 
      avatar: '', 
      status: 'online', 
      mutualFriends: 15, 
      location: 'Lyon',
      favoriteGenres: ['Rock', 'Blues'],
      lastActive: 'Active now'
    }
  ]);

  const [requests, setRequests] = useState([
    { 
      id: 5, 
      name: 'Sophie Martin', 
      username: '@sophiemartin', 
      avatar: '', 
      mutualFriends: 3, 
      location: 'Marseille', 
      date: '2 days ago',
      favoriteGenres: ['Pop', 'Electro']
    },
    { 
      id: 6, 
      name: 'Ahmed Ben', 
      username: '@ahmedben', 
      avatar: '', 
      mutualFriends: 7, 
      location: 'Tunis', 
      date: '1 week ago',
      favoriteGenres: ['Hip-hop', 'R&B']
    }
  ]);

  const [suggestions, setSuggestions] = useState([
    { 
      id: 7, 
      name: 'Claire Dubois', 
      username: '@clairedubois', 
      avatar: '', 
      mutualFriends: 9, 
      location: 'Bordeaux', 
      reason: 'Likes similar music',
      favoriteGenres: ['Rock', 'Jazz']
    },
    { 
      id: 8, 
      name: 'Thomas Petit', 
      username: '@thomaspetit', 
      avatar: '', 
      mutualFriends: 6, 
      location: 'Nantes', 
      reason: 'In your city',
      favoriteGenres: ['Pop', 'Soul']
    },
    { 
      id: 9, 
      name: 'Fatou Diop', 
      username: '@fatoudiop', 
      avatar: '', 
      mutualFriends: 11, 
      location: 'Dakar', 
      reason: 'From same city',
      favoriteGenres: ['Afrobeat', 'R&B']
    }
  ]);

  const [friendGroups, setFriendGroups] = useState([
    { id: 1, name: 'Music Lovers 🎵', members: [1, 2, 4], color: '#b31217' },
    { id: 2, name: 'Old Friends 👫', members: [1, 3], color: '#3b82f6' },
    { id: 3, name: 'Concert Buddies 🎸', members: [2, 4], color: '#10b981' }
  ]);

  // Handlers
  const handleAcceptRequest = (id) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      setFriends([...friends, { ...request, status: 'online', lastActive: 'Active now' }]);
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleRejectRequest = (id) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleAddFriend = (id) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
      // En réalité, cela enverrait une demande d'ami
      alert(`Friend request sent to ${suggestion.name}`);
      setSuggestions(suggestions.filter(s => s.id !== id));
    }
  };

  const handleRemoveFriend = (id) => {
    if (window.confirm('Are you sure you want to unfriend this person?')) {
      setFriends(friends.filter(f => f.id !== id));
    }
  };

  const handleSendMessage = (friend) => {
    setSelectedChatFriend(friend);
    setShowChatModal(true);
  };

  const handleViewProfile = (friendId) => {
    // Navigation vers le profil
    console.log('View profile:', friendId);
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
          onSave={setFriendGroups}
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