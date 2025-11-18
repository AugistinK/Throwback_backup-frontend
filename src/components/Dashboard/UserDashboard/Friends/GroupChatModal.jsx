// src/components/Dashboard/UserDashboard/Friends/GroupChatModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import friendsAPI from '../../../../utils/friendsAPI';
import styles from './Friends.module.css';
import ConfirmModal from './ConfirmModal';

import GroupChatHeader from './GroupChatHeader';
import GroupChatMessages from './GroupChatMessages';
import GroupChatInput from './GroupChatInput';
import GroupAddMembersModal from './GroupAddMembersModal';

const GroupChatModal = ({ group, friends = [], onClose, onUpdateGroup }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?._id || user?.id || null;

  // ID "fonctionnel" de la conversation de groupe (Conversation._id)
  const [conversationId, setConversationId] = useState(
    group?.conversationId ||
      group?.chatConversationId ||
      group?.conversation?._id ||
      group?.conversation?.id ||
      group?.id || // fallback
      null
  );

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState([]);
  const [participantIds, setParticipantIds] = useState([]);

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    data: null
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date) => {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getSenderNameFromUser = (u) => {
    if (!u) return 'Unknown';
    if (u.name) return u.name;
    const full = `${u.prenom || ''} ${u.nom || ''}`.trim();
    if (full) return full;
    return u.email || u.username || 'Unknown';
  };

  const getFriendDisplayName = (f) => {
    if (!f) return 'Unknown';
    if (f.name) return f.name;
    const full = `${f.prenom || ''} ${f.nom || ''}`.trim();
    if (full) return full;
    return f.email || f.username || 'Unknown';
  };

  /**
   * Construire la liste des membres affichables
   * → on utilise en priorité group.participants (viens de /api/conversations, déjà peuplé)
   *    puis group.members (ids simples) + friends + user courant
   */
  useEffect(() => {
    if (!group) {
      setMembers([]);
      setParticipantIds([]);
      return;
    }

    const participantObjs = Array.isArray(group.participants)
      ? group.participants
      : [];

    const memberEntries = Array.isArray(group.members) ? group.members : [];

    const idsFromParticipants = participantObjs
      .map((p) => p && (p._id || p.id || p))
      .filter(Boolean);

    const idsFromMembers = memberEntries
      .map((m) =>
        typeof m === 'string' || typeof m === 'number'
          ? m
          : m?._id || m?.id || null
      )
      .filter(Boolean);

    let ids = [...idsFromParticipants, ...idsFromMembers].map((id) =>
      id.toString()
    );

    // inclure le user courant si pas déjà dedans
    if (
      currentUserId &&
      !ids.some((id) => id === currentUserId.toString())
    ) {
      ids.push(currentUserId.toString());
    }

    ids = [...new Set(ids)];
    setParticipantIds(ids);

    const built = ids.map((id) => {
      const idStr = id.toString();

      if (currentUserId && idStr === currentUserId.toString()) {
        return {
          id: idStr,
          name: getSenderNameFromUser(user) || 'You',
          avatar: user?.photo_profil || user?.avatar || null
        };
      }

      const fromConv =
        participantObjs.find(
          (p) =>
            p &&
            (p._id || p.id || p).toString() === idStr
        ) || null;

      if (fromConv) {
        return {
          id: idStr,
          name: getSenderNameFromUser(fromConv),
          avatar: fromConv.photo_profil || fromConv.avatar || null
        };
      }

      const friend =
        friends.find(
          (f) =>
            (f.id || f._id)?.toString() === idStr
        ) || null;

      if (friend) {
        return {
          id: idStr,
          name: getFriendDisplayName(friend),
          avatar: friend.avatar || friend.photo_profil || null
        };
      }

      return {
        id: idStr,
        name: 'Member',
        avatar: null
      };
    });

    setMembers(built);
  }, [group, friends, currentUserId, user]);

  const buildMessageFromApi = (m) => {
    if (!m) return null;
    const sender = m.sender || m.from;
    const senderId =
      typeof sender === 'string' || typeof sender === 'number'
        ? sender
        : sender?._id || sender?.id || null;

    const senderName = m.senderName || getSenderNameFromUser(sender) || 'Unknown';

    return {
      id: m._id || m.id,
      senderId,
      senderName,
      text: m.content || m.text || '',
      timestamp: formatTime(m.created_date || m.createdAt),
      type: m.type || 'text',
      isOwn:
        !!currentUserId &&
        !!senderId &&
        String(senderId) === String(currentUserId)
    };
  };

  /**
   * 1️⃣ S'assurer qu'on a une conversation de groupe côté backend
   */
  useEffect(() => {
    const ensureConversation = async () => {
      if (!group || !currentUserId) {
        setLoading(false);
        return;
      }

      if (conversationId) return;

      const existingConvId =
        group.conversationId ||
        group.chatConversationId ||
        (group.conversation && (group.conversation._id || group.conversation.id));

      if (existingConvId) {
        setConversationId(existingConvId);
        return;
      }

      // Au cas où le groupe vient de FriendGroups (ids simples)
      const rawMembers = Array.isArray(group.members) ? group.members : [];
      const memberIds = rawMembers
        .map((m) => {
          if (!m) return null;
          if (typeof m === 'string' || typeof m === 'number') return m;
          return m._id || m.id || null;
        })
        .filter(Boolean);

      const participantIds = memberIds.filter(
        (id) => String(id) !== String(currentUserId)
      );

      if (participantIds.length < 2) {
        setLoading(false);
        setConfirmModal({
          isOpen: true,
          type: 'info',
          data: {
            title: 'Group too small',
            message:
              'To create a group chat, you must have at least 3 members in the friend group.',
            showCancel: false,
            confirmText: 'OK'
          }
        });
        return;
      }

      try {
        const groupName = group.name || group.groupName || 'Group';

        const createRes = await friendsAPI.createGroup(
          groupName,
          participantIds,
          group.description || null
        );

        if (!createRes?.success || !createRes.data) {
          console.error(
            'Error creating group conversation:',
            createRes?.message
          );
          setLoading(false);
          setConfirmModal({
            isOpen: true,
            type: 'error',
            data: {
              title: 'Error',
              message:
                createRes?.message ||
                'Unable to create the group chat. Please try again later.',
              showCancel: false,
              confirmText: 'OK'
            }
          });
          return;
        }

        const newConv = createRes.data;
        const newId = newConv._id || newConv.id;

        setConversationId(newId);

        if (onUpdateGroup) {
          onUpdateGroup({
            ...group,
            conversationId: newId,
            conversation: newConv
          });
        }
      } catch (err) {
        console.error('Error creating group conversation:', err);
        setLoading(false);

        let msg = 'Unable to create the group chat.';
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }

        setConfirmModal({
          isOpen: true,
          type: 'error',
          data: {
            title: 'Error',
            message: msg,
            showCancel: false,
            confirmText: 'OK'
          }
        });
      }
    };

    ensureConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, currentUserId, conversationId]);

  /**
   * 2️⃣ Charger les messages quand on a conversationId
   */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await friendsAPI.getGroupMessages(conversationId);

        if (!response?.success) {
          console.error('Error loading group messages:', response?.message);
          setMessages([]);
          return;
        }

        const container = response.data ?? response;
        let rawMessages = [];

        if (Array.isArray(container)) {
          rawMessages = container;
        } else if (Array.isArray(container.messages)) {
          rawMessages = container.messages;
        } else if (container.data) {
          if (Array.isArray(container.data)) {
            rawMessages = container.data;
          } else if (Array.isArray(container.data.messages)) {
            rawMessages = container.data.messages;
          }
        }

        const mapped = rawMessages.map(buildMessageFromApi).filter(Boolean);
        setMessages(mapped);
      } catch (err) {
        console.error('Error loading group messages:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (isConnected && socket && conversationId) {
      socket.emit('join-group', { groupId: conversationId });
    }

    return () => {
      if (socket && conversationId) {
        socket.emit('leave-group', { groupId: conversationId });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isConnected]);

  /**
   * 3️⃣ Temps réel
   */
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleGroupMessage = (data) => {
      const incomingGroupId =
        data.groupId || data.group_id || data.group?._id || data.group?.id;

      if (!incomingGroupId) return;
      if (String(incomingGroupId) !== String(conversationId)) return;

      const payload = data.message || data;
      const mapped = buildMessageFromApi(payload);
      if (!mapped) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id && m.id === mapped.id)) {
          return prev;
        }
        return [...prev, mapped];
      });
    };

    socket.on('group-message', handleGroupMessage);

    return () => {
      socket.off('group-message', handleGroupMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversationId, currentUserId]);

  /**
   * Envoi message (appelé par GroupChatInput)
   */
  const handleSendMessage = async (contentToSend) => {
    if (!contentToSend || !contentToSend.trim()) return;
    if (!conversationId) {
      console.error('Missing conversation id, cannot send message.');
      return;
    }

    const tempId = Date.now().toString();
    const senderName = getSenderNameFromUser(user) || 'You';

    const optimisticMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName,
      text: contentToSend,
      timestamp: formatTime(new Date()),
      type: 'text',
      isOwn: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await friendsAPI.sendGroupMessage(
        conversationId,
        contentToSend,
        'text'
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send group message');
      }

      const apiMessage = response.data;
      const finalMessage = buildMessageFromApi(apiMessage) || optimisticMessage;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? finalMessage : m))
      );
    } catch (err) {
      console.error('Error sending group message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Send Error',
          message: 'Failed to send your message. Please try again.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
    }
  };

  // ====== GESTION MEMBRES ======

  const friendsToAdd = friends.filter((f) => {
    const fid = (f.id || f._id)?.toString();
    if (!fid) return false;
    return !participantIds.includes(fid);
  });

  const handleAddMembersClick = () => {
    if (!conversationId) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Group not ready',
          message:
            'The group chat is not ready yet. Please try again in a few seconds.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
      return;
    }

    if (friendsToAdd.length === 0) {
      setConfirmModal({
        isOpen: true,
        type: 'info',
        data: {
          title: 'No friends to add',
          message: 'All your friends are already in this group.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
      return;
    }

    setShowAddMembersModal(true);
  };

  const handleConfirmAddMembers = async (selectedIds) => {
    if (!conversationId || !selectedIds.length) {
      setShowAddMembersModal(false);
      return;
    }

    try {
      setProcessingAction(true);

      const promises = selectedIds.map((id) =>
        friendsAPI.addParticipantToGroup(conversationId, id)
      );
      const results = await Promise.all(promises);

      const hasError = results.some((r) => !r?.success);
      if (hasError) {
        throw new Error('One or more participants could not be added.');
      }

      // mise à jour locale
      const newlyAddedFriends = friends.filter((f) =>
        selectedIds.includes((f.id || f._id)?.toString())
      );

      setParticipantIds((prev) => [
        ...new Set([
          ...prev,
          ...selectedIds.map((id) => id.toString())
        ])
      ]);

      setMembers((prev) => [
        ...prev,
        ...newlyAddedFriends.map((f) => ({
          id: (f.id || f._id).toString(),
          name: getFriendDisplayName(f),
          avatar: f.avatar || f.photo_profil || null
        }))
      ]);

      if (onUpdateGroup) {
        onUpdateGroup();
      }

      setShowAddMembersModal(false);
      setConfirmModal({
        isOpen: true,
        type: 'success',
        data: {
          title: 'Members added',
          message: 'New members have been added to the group.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
    } catch (err) {
      console.error('Error adding members:', err);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Error',
          message: 'Unable to add some members. Please try again.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewMembers = () => {
    const names =
      members.length > 0
        ? members.map((m) => m.name).join(', ')
        : 'No members found in this group.';

    setConfirmModal({
      isOpen: true,
      type: 'info',
      data: {
        title: `Members (${members.length})`,
        message: names,
        showCancel: false,
        confirmText: 'Close'
      }
    });
  };

  const groupName = group.name || group.groupName || 'Group chat';

  const handleLeaveGroup = () => {
    if (!conversationId || !currentUserId) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Error',
          message: 'Missing group or user information.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Leave Group',
        message: `Are you sure you want to leave "${groupName}"? You'll no longer receive messages from this group.`,
        confirmText: 'Leave',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            const res = await friendsAPI.removeParticipantFromGroup(
              conversationId,
              currentUserId
            );
            if (!res?.success) {
              throw new Error(res?.message || 'Failed to leave group');
            }

            setParticipantIds((prev) =>
              prev.filter(
                (id) => id.toString() !== currentUserId.toString()
              )
            );
            setMembers((prev) =>
              prev.filter(
                (m) => m.id.toString() !== currentUserId.toString()
              )
            );

            if (onUpdateGroup) {
              onUpdateGroup();
            }
            onClose();
          } catch (err) {
            console.error('Error leaving group:', err);
            setConfirmModal({
              isOpen: true,
              type: 'error',
              data: {
                title: 'Error',
                message: 'Unable to leave the group. Please try again.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          }
        }
      }
    });
  };

  const handleDeleteGroup = () => {
    if (!conversationId) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Error',
          message: 'No conversation id for this group.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'error',
      data: {
        title: 'Delete Group',
        message: `Are you sure you want to delete "${groupName}"? This action cannot be undone and all messages will be lost.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            const res = await friendsAPI.deleteGroupConversation(conversationId);
            if (!res?.success) {
              throw new Error(res?.message || 'Failed to delete group');
            }

            if (onUpdateGroup) {
              onUpdateGroup();
            }
            onClose();
          } catch (err) {
            console.error('Error deleting group:', err);
            setConfirmModal({
              isOpen: true,
              type: 'error',
              data: {
                title: 'Error',
                message: 'Unable to delete the group. Please try again.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          }
        }
      }
    });
  };

  const canSend = !!conversationId && isConnected;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chatModal} onClick={(e) => e.stopPropagation()}>
        <GroupChatHeader
          groupName={groupName}
          memberCount={members.length || group.members?.length || 0}
          color={group.color || '#b31217'}
          isCreator={group.isCreator}
          onAddMembers={handleAddMembersClick}
          onViewMembers={handleViewMembers}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onClose={onClose}
        />

        <GroupChatMessages
          messages={messages}
          loading={loading}
          getInitials={getInitials}
          messagesEndRef={messagesEndRef}
        />

        <GroupChatInput
          onSend={handleSendMessage}
          isConnected={isConnected}
          conversationReady={!!conversationId}
        />

        {!isConnected && (
          <div className={styles.connectionWarning}>
            Connecting to chat server...
          </div>
        )}
      </div>

      <GroupAddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => !processingAction && setShowAddMembersModal(false)}
        friendsToAdd={friendsToAdd}
        onConfirm={handleConfirmAddMembers}
        processing={processingAction}
        getFriendDisplayName={getFriendDisplayName}
        getInitials={getInitials}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, type: '', data: null })
        }
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

export default GroupChatModal;
