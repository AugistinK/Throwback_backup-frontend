// src/components/Dashboard/UserDashboard/Chat/ConversationSidebar.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMessage } from '@fortawesome/free-solid-svg-icons';
import ConversationItem from './ConversationItem';
import styles from './Chat.module.css';

const ConversationSidebar = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onSearch,
  searchQuery,
  activeTab,
  onTabChange,
  unreadCount,
  loading,
  onlineUsers
}) => {
  const tabs = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'groups', label: 'Groups' }
  ];

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderLeft}>
          <FontAwesomeIcon icon={faMessage} className={styles.logo} />
          <h2 className={styles.sidebarTitle}>Messages</h2>
        </div>
        {/* Plus de boutons New Group / More options ici */}
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search or start a chat"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.tabActive : ''
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={styles.tabBadge}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className={styles.conversationList}>
        {loading ? (
          <div className={styles.loadingConversations}>
            <div className={styles.spinner}></div>
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyConversations}>
            <FontAwesomeIcon icon={faMessage} className={styles.emptyIcon} />
            <p>No conversations yet</p>
            <p className={styles.emptySubtext}>
              {searchQuery ? 'No results found' : 'Start a new conversation'}
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected =
              selectedConversation &&
              selectedConversation._id === conversation._id;

            const isOnline =
              !conversation.isGroup &&
              conversation.participant &&
              onlineUsers.has(conversation.participant._id);

            return (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={isSelected}
                onSelect={() => onSelectConversation(conversation)}
                isOnline={isOnline}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
