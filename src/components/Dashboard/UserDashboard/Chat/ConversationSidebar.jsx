// src/components/Dashboard/UserDashboard/Chat/ConversationSidebar.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEllipsisVertical,
  faMessage,
  faArchive,
  faBell,
  faBellSlash,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
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
    { id: 'all', label: 'Toutes', count: conversations.length },
    { id: 'unread', label: 'Non lues', count: unreadCount },
    { id: 'favorites', label: 'Favoris' },
    { id: 'groups', label: 'Groupes' }
  ];

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderLeft}>
          <FontAwesomeIcon icon={faMessage} className={styles.logo} />
          <h2 className={styles.sidebarTitle}>Messages</h2>
        </div>
        <div className={styles.sidebarHeaderActions}>
          <button className={styles.headerButton} title="Nouveau message">
            <FontAwesomeIcon icon={faMessage} />
          </button>
          <button className={styles.headerButton} title="Plus d'options">
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className={styles.searchBar}>
        <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Rechercher ou démarrer une discussion"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Onglets */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={styles.tabBadge}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Archivées */}
      <button className={styles.archivedButton}>
        <FontAwesomeIcon icon={faArchive} />
        <span>Archivées</span>
      </button>

      {/* Liste des conversations */}
      <div className={styles.conversationList}>
        {loading ? (
          <div className={styles.loadingConversations}>
            <div className={styles.spinner}></div>
            <p>Chargement des conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyConversations}>
            <FontAwesomeIcon icon={faMessage} className={styles.emptyIcon} />
            <p>Aucune conversation</p>
            <p className={styles.emptySubtext}>
              {searchQuery 
                ? 'Aucun résultat trouvé' 
                : 'Commencez une nouvelle conversation'}
            </p>
          </div>
        ) : (
          conversations.map(conversation => (
            <ConversationItem
              key={conversation.participant._id}
              conversation={conversation}
              isSelected={selectedConversation?.participant._id === conversation.participant._id}
              onSelect={() => onSelectConversation(conversation)}
              isOnline={onlineUsers.has(conversation.participant._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;