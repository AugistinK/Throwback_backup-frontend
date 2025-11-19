// src/components/Dashboard/UserDashboard/Chat/Chat.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ConversationSidebar from './ConversationSidebar';
import ChatArea from './ChatArea';
import EmptyChat from './EmptyChat';
import GroupChatModal from './GroupChatModal';
import styles from './Chat.module.css';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const currentUserId = user?.id || user?._id;

  const getImageUrl = (path) => {
    if (!path) return null; // Retourner null pour ne pas afficher d'image cassée
    if (path.startsWith('http')) return path;

    const backendUrl =
      process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    
    // Si le path commence déjà par /uploads, l'utiliser tel quel
    if (path.startsWith('/uploads')) {
      return `${backendUrl}${path}`;
    }
    
    // Si c'est juste un nom de fichier, essayer /uploads/profiles/
    if (!path.includes('/')) {
      return `${backendUrl}/uploads/profiles/${path}`;
    }
    
    // Sinon, normaliser le path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}${normalizedPath}`;
  };

  const normalizeBackendConversation = (raw) => {
    if (!raw) return null;

    const isGroup =
      raw.isGroup === true ||
      raw.type === 'group' ||
      !!raw.group ||
      !!raw.groupId ||
      raw.kind === 'group';

    if (isGroup) {
      const group = raw.group || raw;
      const groupId = raw.groupId || group._id || raw._id;

      const name =
        raw.groupName ||
        raw.name ||
        group.groupName ||
        group.name ||
        raw.title ||
        'Group';

      const lastMessage =
        raw.lastMessage ||
        raw.last_message ||
        group.lastMessage ||
        null;

      const unread = raw.unreadCount ?? raw.unread ?? 0;

      const members = raw.members || group.members || raw.participants || [];

      return {
        ...raw,
        _id: groupId,
        groupId,
        isGroup: true,
        name,
        groupName: name,
        members,
        lastMessage,
        unreadCount: unread,
        isArchived: !!raw.isArchived,
        source: 'conversation'
      };
    }

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

  const buildConversationFromFriend = (friend) => {
    const participant = {
      ...friend,
      photo_profil: getImageUrl(friend.photo_profil)
    };

    return {
      _id: `friend-${friend._id}`,
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
      name: group.groupName || group.name || group.title || 'Group',
      groupName: group.groupName || group.name || group.title || 'Group',
      members: group.members || group.participants || [],
      lastMessage: group.lastMessage || null,
      unreadCount: group.unreadCount || 0,
      isArchived: false,
      groupCreator: group.groupCreator || group.createdBy,
      source: 'group'
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);

      const [convRes, groupsRes, friendsRes] = await Promise.all([
        friendsAPI.getConversations().catch((e) => {
          console.error('Error fetching conversations:', e);
          return null;
        }),
        friendsAPI.getFriendGroups().catch((e) => {
          console.warn('Error fetching friend groups:', e);
          return null;
        }),
        friendsAPI.getFriends().catch((e) => {
          console.warn('Error fetching friends:', e);
          return null;
        })
      ]);

      let all = [];

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

  const handleCreateGroup = () => {
    setShowGroupModal(true);
  };

  const handleGroupCreated = (newGroup) => {
    const conversation = buildConversationFromGroup(newGroup);
    setConversations((prev) => [conversation, ...prev]);
    setSelectedConversation(conversation);
  };

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.trim().toLowerCase();

    let displayName = '';
    if (conv.isGroup) {
      displayName = conv.name || conv.groupName || '';
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
        onCreateGroup={handleCreateGroup}
      />

      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
          isOnline={isSelectedOnline}
          onConversationUpdated={loadConversations}
        />
      ) : (
        <EmptyChat />
      )}

      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default Chat;