// src/components/Dashboard/UserDashboard/Chat/Chat.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ConversationSidebar from './ConversationSidebar';
import ChatArea from './ChatArea';
import EmptyChat from './EmptyChat';
import styles from './Chat.module.css';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, favorites, groups
  const [unreadCount, setUnreadCount] = useState(0);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl =
      process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Socket listeners to keep direct conversations list in sync
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Only update direct chats here (groups are handled via REST refresh)
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (
            !conv.isGroup &&
            conv.participant &&
            (conv.participant._id === data.message.sender._id ||
              conv.participant._id === data.message.receiver._id)
          ) {
            return {
              ...conv,
              lastMessage: data.message,
              unreadCount:
                conv.participant._id === data.message.sender._id
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount || 0
            };
          }
          return conv;
        });

        return updated.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_date || 0) -
            new Date(a.lastMessage?.created_date || 0)
        );
      });

      if (data.message.receiver._id === user.id) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleMessageSent = (data) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (
            !conv.isGroup &&
            conv.participant &&
            conv.participant._id === data.message.receiver._id
          ) {
            return {
              ...conv,
              lastMessage: data.message
            };
          }
          return conv;
        });

        return updated.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_date || 0) -
            new Date(a.lastMessage?.created_date || 0)
        );
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
    };
  }, [socket, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getConversations();

      if (response.success) {
        const conversationsWithImages = response.data.map((conv) => {
          // Direct chat: has participant (friend)
          if (!conv.isGroup && conv.participant) {
            return {
              ...conv,
              participant: {
                ...conv.participant,
                photo_profil: getImageUrl(conv.participant.photo_profil)
              },
              isGroup: false
            };
          }

          // Group chat: keep as is; we only ensure isGroup flag
          return {
            ...conv,
            isGroup: !!conv.isGroup
          };
        });

        // Sort by last message date if available
        conversationsWithImages.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_date || 0) -
            new Date(a.lastMessage?.created_date || 0)
        );

        setConversations(conversationsWithImages);

        const total = conversationsWithImages.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);

    if (conversation.unreadCount > 0) {
      const selectedKey = conversation.isGroup
        ? conversation._id
        : conversation.participant?._id;

      setConversations((prev) =>
        prev.map((conv) => {
          const convKey = conv.isGroup ? conv._id : conv.participant?._id;
          return convKey === selectedKey
            ? { ...conv, unreadCount: 0 }
            : conv;
        })
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - (conversation.unreadCount || 0))
      );
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Archive / Unarchive currently selected conversation
  const handleToggleArchiveConversation = async () => {
    if (!selectedConversation) {
      alert('Please select a conversation first.');
      return;
    }

    const conversationId = selectedConversation._id;
    if (!conversationId) {
      console.warn('No conversation id for selected conversation');
      return;
    }

    const currentlyArchived = !!selectedConversation.isArchived;

    try {
      const res = currentlyArchived
        ? await friendsAPI.unarchiveChat(conversationId)
        : await friendsAPI.archiveChat(conversationId);

      if (res?.success === false) {
        alert(res.message || 'Failed to update archive state.');
        return;
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, isArchived: !currentlyArchived }
            : conv
        )
      );

      setSelectedConversation((prev) =>
        prev && prev._id === conversationId
          ? { ...prev, isArchived: !currentlyArchived }
          : prev
      );
    } catch (error) {
      console.error('Error toggling archive state:', error);
      alert('Failed to update archive state. Please try again.');
    }
  };

  // Filter conversations according to search + active tab
  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.trim().toLowerCase();

    let displayName = '';
    if (conv.isGroup) {
      displayName = conv.name || '';
    } else if (conv.participant) {
      displayName = `${conv.participant.prenom || ''} ${
        conv.participant.nom || ''
      }`;
    }

    const matchesSearch =
      !q ||
      displayName.toLowerCase().includes(q) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'unread':
        return (conv.unreadCount || 0) > 0;
      case 'favorites':
        return !!conv.isFavorite;
      case 'groups':
        return !!conv.isGroup;
      default:
        return true;
    }
  });

  return (
    <div className={styles.chatContainer}>
      <ConversationSidebar
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadCount={unreadCount}
        loading={loading}
        onlineUsers={onlineUsers}
        onToggleArchive={handleToggleArchiveConversation}
      />

      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
          isOnline={
            !selectedConversation.isGroup &&
            selectedConversation.participant &&
            onlineUsers.has(selectedConversation.participant._id)
          }
        />
      ) : (
        <EmptyChat />
      )}
    </div>
  );
};

export default Chat;
