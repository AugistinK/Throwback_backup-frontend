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

  // Normalise une conversation venant du backend /api/conversations
  const normalizeBackendConversation = (raw) => {
    if (!raw) return null;

    const isGroup =
      raw.isGroup === true ||
      raw.type === 'group' ||
      !!raw.group ||
      !!raw.groupId ||
      raw.kind === 'group';

    // === GROUP CHAT ===
    if (isGroup) {
      const group = raw.group || raw;
      const groupId = raw.groupId || group._id || raw._id;

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
        _id: groupId,              // ⚠️ on utilise le groupId pour charger les messages
        groupId,
        isGroup: true,
        name,
        members:
          raw.members || group.members || raw.participants || [],
        lastMessage,
        unreadCount: unread,
        isArchived: !!raw.isArchived,
        source: 'conversation'
      };
    }

    // === DIRECT CHAT (AMI) ===
    let participant = raw.participant || null;

    if (!participant && Array.isArray(raw.participants)) {
      participant =
        raw.participants.find((p) => p._id !== currentUserId) ||
        raw.participants[0];
    }

    if (!participant) {
      participant = raw.friend || raw.otherUser || raw.user || null;
    }

    if (!participant) {
      // conversation cassée, on ignore
      return null;
    }

    if (participant.photo_profil) {
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
      isArchived: !!raw.isArchived,
      source: 'conversation'
    };
  };

  // Conversation créée à partir d’un ami (si aucune convo backend n’existe)
  const buildConversationFromFriend = (friend) => {
    const participant = {
      ...friend,
      photo_profil: getImageUrl(friend.photo_profil)
    };

    return {
      _id: `friend-${friend._id}`, // id virtuel
      isGroup: false,
      participant,
      lastMessage: null,
      unreadCount: 0,
      isArchived: false,
      source: 'friend'
    };
  };

  const buildConversationFromGroup = (group) => {
    return {
      _id: group._id,
      groupId: group._id,
      isGroup: true,
      name: group.name || group.title || 'Group',
      members: group.members || group.participants || [],
      lastMessage: null,
      unreadCount: 0,
      isArchived: false,
      source: 'group'
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);

      // 1) conversations (backend)
      const [convRes, groupsRes, friendsRes] = await Promise.all([
        friendsAPI.getConversations().catch((e) => {
          console.error('Error fetching conversations:', e);
          return null;
        }),
        friendsAPI.getFriendGroups().catch((e) => {
          console.warn('Error fetching friend groups (optional):', e);
          return null;
        }),
        friendsAPI.getFriends().catch((e) => {
          console.warn('Error fetching friends (optional):', e);
          return null;
        })
      ]);

      let all = [];

      // === Conversations backend (directes + éventuellement groupes) ===
      if (convRes && convRes.success) {
        let rawConvs = [];

        if (Array.isArray(convRes.data)) {
          rawConvs = convRes.data;
        } else if (Array.isArray(convRes.conversations)) {
          rawConvs = convRes.conversations;
        } else if (Array.isArray(convRes.data?.conversations)) {
          rawConvs = convRes.data.conversations;
        }

        const normalized = rawConvs
          .map(normalizeBackendConversation)
          .filter(Boolean);

        all = all.concat(normalized);
      }

      // === Groupes d'amis (au cas où /api/conversations ne les renvoie pas) ===
      if (groupsRes && groupsRes.success && Array.isArray(groupsRes.data)) {
        const existingGroupIds = new Set(
          all
            .filter((c) => c.isGroup)
            .map((c) => (c.groupId || c._id || '').toString())
        );

        groupsRes.data.forEach((g) => {
          const idStr = (g._id || '').toString();
          if (!existingGroupIds.has(idStr)) {
            all.push(buildConversationFromGroup(g));
          }
        });
      }

      // === Amis : on crée des conversations virtuelles pour ceux qui n’en ont pas ===
      if (friendsRes && friendsRes.success && Array.isArray(friendsRes.data)) {
        const existingFriendIds = new Set(
          all
            .filter((c) => !c.isGroup && c.participant)
            .map((c) => c.participant._id?.toString())
        );

        friendsRes.data.forEach((friend) => {
          const friendId = friend._id?.toString();
          if (!friendId) return;
          if (!existingFriendIds.has(friendId)) {
            all.push(buildConversationFromFriend(friend));
          }
        });
      }

      // Tri par dernière activité (les amis sans message vont en bas)
      all.sort((a, b) => {
        const da = new Date(
          a.lastMessage?.created_date || a.updatedAt || a.createdAt || 0
        ).getTime();
        const db = new Date(
          b.lastMessage?.created_date || b.updatedAt || b.createdAt || 0
        ).getTime();
        return db - da;
      });

      setConversations(all);

      const totalUnread = all.reduce(
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

  // Mise à jour temps réel uniquement pour les conversations directes (Socket)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setConversations((prev) => {
        let found = false;

        const updated = prev.map((conv) => {
          if (
            !conv.isGroup &&
            conv.participant &&
            (conv.participant._id === data.message.sender._id ||
              conv.participant._id === data.message.receiver._id)
          ) {
            found = true;
            const isForMe = data.message.receiver._id === currentUserId;

            return {
              ...conv,
              lastMessage: data.message,
              unreadCount: isForMe
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0
            };
          }
          return conv;
        });

        // Si aucune conversation trouvée, on peut en créer une à la volée
        if (!found) {
          const otherUser =
            data.message.sender._id === currentUserId
              ? data.message.receiver
              : data.message.sender;

          const newConv = buildConversationFromFriend(otherUser);
          newConv.lastMessage = data.message;
          newConv.unreadCount =
            data.message.receiver._id === currentUserId ? 1 : 0;

          updated.push(newConv);
        }

        // tri par dernière activité
        updated.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_date || 0) -
            new Date(a.lastMessage?.created_date || 0)
        );

        return updated;
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

        updated.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_date || 0) -
            new Date(a.lastMessage?.created_date || 0)
        );

        return updated;
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

  // Archive / unarchive uniquement les conversations réelles (pas les virtuelles créées depuis les amis)
  const handleToggleArchiveConversation = async () => {
    if (!selectedConversation?._id) {
      alert('Please select a conversation first.');
      return;
    }

    if (selectedConversation.source !== 'conversation') {
      alert('Archiving is only available for existing conversations.');
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

  // Filtre pour la sidebar
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
