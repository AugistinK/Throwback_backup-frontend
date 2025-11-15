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
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, favorites, groups
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUserId = user?.id || user?._id;

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl =
      process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  // Normaliser une conversation (directe ou groupe)
  const normalizeConversation = (raw) => {
    if (!raw) return null;

    const isGroup =
      raw.isGroup === true ||
      raw.type === 'group' ||
      !!raw.group ||
      !!raw.groupId ||
      raw.kind === 'group';

    // ----- GROUP CHAT -----
    if (isGroup) {
      const group = raw.group || raw;
      const id = raw._id || raw.id || group._id || raw.groupId;

      const name =
        raw.name ||
        group.name ||
        raw.title ||
        'Group';

      const lastMessage =
        raw.lastMessage ||
        raw.last_message ||
        group.lastMessage ||
        null;

      const unread = raw.unreadCount ?? raw.unread ?? 0;

      return {
        ...raw,
        _id: id,
        isGroup: true,
        name,
        members:
          raw.members || group.members || raw.participants || [],
        lastMessage,
        unreadCount: unread,
        isArchived: !!raw.isArchived
      };
    }

    // ----- DIRECT CHAT (AMI) -----
    let participant = raw.participant || null;

    if (!participant && Array.isArray(raw.participants)) {
      participant =
        raw.participants.find((p) => p._id !== currentUserId) ||
        raw.participants[0];
    }

    if (!participant) {
      participant = raw.friend || raw.otherUser || raw.user || null;
    }

    if (participant && participant.photo_profil) {
      participant = {
        ...participant,
        photo_profil: getImageUrl(participant.photo_profil)
      };
    }

    const lastMessage = raw.lastMessage || raw.last_message || null;
    const unread = raw.unreadCount ?? raw.unread ?? 0;

    return {
      ...raw,
      isGroup: false,
      participant,
      lastMessage,
      unreadCount: unread,
      isArchived: !!raw.isArchived
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);

      // On récupère à la fois les conversations et les groupes d'amis
      const [convRes, groupsRes] = await Promise.all([
        friendsAPI.getConversations().catch((e) => {
          console.error('Error fetching conversations:', e);
          return null;
        }),
        friendsAPI.getFriendGroups().catch((e) => {
          console.warn('Error fetching friend groups (optional):', e);
          return null;
        })
      ]);

      let items = [];

      // Conversations directes + éventuellement groupes déjà inclus
      if (convRes) {
        if (convRes.success && Array.isArray(convRes.data)) {
          items = items.concat(convRes.data);
        } else if (Array.isArray(convRes)) {
          items = items.concat(convRes);
        }
      }

      // Groupes d'amis (si pas déjà inclus)
      if (groupsRes && groupsRes.success && Array.isArray(groupsRes.data)) {
        const existingGroupIds = new Set(
          items
            .filter((c) => c.isGroup || c.type === 'group')
            .map((c) => (c._id || c.id || c.groupId || '').toString())
        );

        const groupConvs = groupsRes.data.map((g) => ({
          ...g,
          _id: g._id,
          groupId: g._id,
          isGroup: true,
          group: g
        }));

        groupConvs.forEach((g) => {
          const idStr = (g._id || g.groupId || '').toString();
          if (!existingGroupIds.has(idStr)) {
            items.push(g);
          }
        });
      }

      const normalized = items
        .map(normalizeConversation)
        .filter(Boolean);

      // Tri par dernière activité
      normalized.sort((a, b) => {
        const da = new Date(
          a.lastMessage?.created_date || a.updatedAt || a.createdAt || 0
        ).getTime();
        const db = new Date(
          b.lastMessage?.created_date || b.updatedAt || b.createdAt || 0
        ).getTime();
        return db - da;
      });

      setConversations(normalized);

      const totalUnread = normalized.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Mise à jour en temps réel pour les conversations directes (via Socket)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          // direct chat
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
                data.message.receiver._id === currentUserId
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

      if (data.message.receiver._id === currentUserId) {
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
  }, [socket, currentUserId]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);

    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversation._id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
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

  const handleToggleArchiveConversation = async () => {
    if (!selectedConversation?._id) {
      alert('Please select a conversation first.');
      return;
    }

    const conversationId = selectedConversation._id;
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

  // Filtrer les conversations pour la sidebar
  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.trim().toLowerCase();

    let displayName = '';
    if (conv.isGroup) {
      displayName = conv.name || '';
    } else if (conv.participant) {
      displayName = `${conv.participant.prenom || ''} ${
        conv.participant.nom || ''
      }`.trim();
    }

    const matchesSearch =
      !q ||
      displayName.toLowerCase().includes(q) ||
      (conv.lastMessage?.content || '')
        .toLowerCase()
        .includes(q);

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

  const isSelectedOnline =
    selectedConversation &&
    !selectedConversation.isGroup &&
    selectedConversation.participant &&
    onlineUsers.has(selectedConversation.participant._id);

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
          isOnline={isSelectedOnline}
        />
      ) : (
        <EmptyChat />
      )}
    </div>
  );
};

export default Chat;
