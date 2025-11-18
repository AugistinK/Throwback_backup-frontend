// src/components/Dashboard/UserDashboard/Friends/GroupChatModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import friendsAPI from '../../../../utils/friendsAPI';
import styles from './Friends.module.css';
import EmojiPicker from './EmojiPicker';
import ConfirmModal from './ConfirmModal';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPaperPlane,
  faSmile,
  faEllipsisVertical,
  faUsers,
  faUserPlus,
  faTrash,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';

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
      null
  );

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // membres du groupe (pour View/Add/Leave)
  const [members, setMembers] = useState([]);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    data: null
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll en bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
   * Construire la liste des membres affichables à partir de group.members + friends + user courant
   */
  useEffect(() => {
    const buildMembers = () => {
      if (!group) {
        setMembers([]);
        return;
      }

      const rawMembers = Array.isArray(group.members) ? group.members : [];
      const ids = rawMembers
        .map((m) =>
          typeof m === 'string' || typeof m === 'number'
            ? m
            : m?._id || m?.id || null
        )
        .filter(Boolean);

      // inclure le user courant si pas déjà dedans
      if (currentUserId && !ids.some((id) => String(id) === String(currentUserId))) {
        ids.push(currentUserId);
      }

      const uniqueIds = [...new Set(ids.map((id) => String(id)))];

      const built = uniqueIds.map((idStr) => {
        const id = idStr;

        if (currentUserId && String(id) === String(currentUserId)) {
          return {
            id,
            name: getSenderNameFromUser(user) || 'You',
            avatar: user?.photo_profil || user?.avatar || null
          };
        }

        const friend =
          friends.find((f) => String(f.id || f._id) === id) || null;

        if (friend) {
          return {
            id,
            name: getFriendDisplayName(friend),
            avatar: friend.avatar || friend.photo_profil || null
          };
        }

        // fallback
        return {
          id,
          name: 'Member',
          avatar: null
        };
      });

      setMembers(built);
    };

    buildMembers();
  }, [group, friends, currentUserId, user]);

  /**
   * 1️⃣ S'assurer qu'on a une conversation de groupe côté backend
   *    - si group.conversationId existe on l'utilise
   *    - sinon on crée un groupe via /api/conversations/groups
   */
  useEffect(() => {
    const ensureConversation = async () => {
      if (!group || !currentUserId) {
        setLoading(false);
        return;
      }

      // Déjà résolue
      if (conversationId) {
        return;
      }

      // Si la conversation est déjà connue côté parent (prop)
      const existingConvId =
        group.conversationId ||
        group.chatConversationId ||
        (group.conversation && (group.conversation._id || group.conversation.id));

      if (existingConvId) {
        setConversationId(existingConvId);
        return;
      }

      // Construire la liste des participants à partir du Friend Group
      const rawMembers = Array.isArray(group.members) ? group.members : [];
      const memberIds = rawMembers
        .map((m) => {
          if (!m) return null;
          if (typeof m === 'string' || typeof m === 'number') return m;
          return m._id || m.id || null;
        })
        .filter(Boolean);

      // ⚠️ IMPORTANT :
      // On exclut le créateur de la liste envoyée au backend
      // car Conversation.createGroup() l'ajoute déjà,
      // et Friendship.areFriends(userId, userId) renvoie false.
      const participantIds = memberIds.filter(
        (id) => String(id) !== String(currentUserId)
      );

      if (participantIds.length < 2) {
        // Backend impose au moins 2 participants (donc groupe >= 3 personnes au total)
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

        // Permet au parent de mémoriser l'ID de conversation pour ce groupe
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
   * 2️⃣ Charger les messages une fois qu'on a conversationId
   *    + rejoindre le groupe via Socket.IO
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

        // accepter plusieurs formats ({success,data:{messages}}, {success,messages}, etc.)
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

    // Rejoindre le groupe via Socket.IO (optionnel, le backend envoie déjà par userId)
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
   * 3️⃣ Ecouter les messages temps réel (événement 'group-message')
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
          return prev; // éviter les doublons (socket + API)
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!conversationId) {
      console.error('Missing conversation id, cannot send message.');
      return;
    }

    const contentToSend = message;
    setMessage('');
    setShowEmojiPicker(false);

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
      // Annuler le message optimiste
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // ====== GESTION MEMBRES / OPTIONS ======

  const memberIdsSet = new Set(members.map((m) => String(m.id)));
  const availableFriends = friends.filter(
    (f) => !memberIdsSet.has(String(f.id || f._id))
  );

  const toggleSelectNewMember = (friendId) => {
    setSelectedNewMembers((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddMembers = () => {
    if (!conversationId) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Group not ready',
          message: 'The group chat is not ready yet. Please try again in a few seconds.',
          showCancel: false,
          confirmText: 'OK'
        }
      });
      return;
    }

    if (availableFriends.length === 0) {
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
      setShowOptionsMenu(false);
      return;
    }

    setSelectedNewMembers([]);
    setShowOptionsMenu(false);
    setShowAddMembersModal(true);
  };

  const handleConfirmAddMembers = async () => {
    if (!conversationId || selectedNewMembers.length === 0) {
      setShowAddMembersModal(false);
      return;
    }

    try {
      setProcessingAction(true);
      const promises = selectedNewMembers.map((id) =>
        friendsAPI.addParticipantToGroup(conversationId, id)
      );
      const results = await Promise.all(promises);

      const hasError = results.some((r) => !r?.success);
      if (hasError) {
        throw new Error('One or more participants could not be added.');
      }

      // mettre à jour la liste des membres localement
      const newlyAdded = availableFriends.filter((f) =>
        selectedNewMembers.includes(f.id)
      );
      setMembers((prev) => [
        ...prev,
        ...newlyAdded.map((f) => ({
          id: f.id,
          name: getFriendDisplayName(f),
          avatar: f.avatar || f.photo_profil || null
        }))
      ]);

      if (onUpdateGroup) {
        onUpdateGroup(); // refresh côté parent
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

    setShowOptionsMenu(false);
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

  const groupName = group.name || group.groupName || 'Group chat';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chatModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div
              className={styles.chatAvatar}
              style={{ backgroundColor: group.color || '#b31217' }}
            >
              <FontAwesomeIcon
                icon={faUsers}
                style={{ fontSize: 24, color: 'white' }}
              />
            </div>
            <div className={styles.chatHeaderInfo}>
              <h3 className={styles.chatName}>{groupName}</h3>
              <p className={styles.chatStatus}>
                {members.length || group.members?.length || 0} members
              </p>
            </div>
          </div>

          <div className={styles.chatHeaderActions}>
            <div className={styles.optionsMenuWrapper}>
              <button
                className={styles.chatActionButton}
                title="More options"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ fontSize: 20 }}
                />
              </button>

              {showOptionsMenu && (
                <>
                  <div
                    className={styles.menuOverlay}
                    onClick={() => setShowOptionsMenu(false)}
                  />
                  <div className={styles.chatOptionsMenu}>
                    <button
                      className={styles.chatOptionItem}
                      onClick={handleAddMembers}
                    >
                      <FontAwesomeIcon
                        icon={faUserPlus}
                        style={{ fontSize: 16 }}
                      />
                      Add Members
                    </button>
                    <button
                      className={styles.chatOptionItem}
                      onClick={handleViewMembers}
                    >
                      <FontAwesomeIcon
                        icon={faUsers}
                        style={{ fontSize: 16 }}
                      />
                      View Members
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={handleLeaveGroup}
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        style={{ fontSize: 16 }}
                      />
                      Leave Group
                    </button>
                    {group.isCreator && (
                      <button
                        className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                        onClick={handleDeleteGroup}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{ fontSize: 16 }}
                        />
                        Delete Group
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button className={styles.closeButton} onClick={onClose}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.chatMessages}>
          {loading && (
            <div className={styles.loadingMessages}>
              <div className={styles.spinner}></div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageWrapper} ${
                msg.isOwn ? styles.messageRight : styles.messageLeft
              }`}
            >
              {!msg.isOwn && (
                <div className={styles.messageAvatar}>
                  <div className={styles.miniAvatarPlaceholder}>
                    {getInitials(msg.senderName)}
                  </div>
                </div>
              )}
              <div className={styles.messageBubble}>
                {!msg.isOwn && (
                  <p className={styles.messageSender}>{msg.senderName}</p>
                )}
                <p className={styles.messageText}>{msg.text}</p>
                <span className={styles.messageTime}>{msg.timestamp}</span>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <form className={styles.chatInput} onSubmit={handleSendMessage}>
          <div className={styles.chatInputActions}>
            <button
              type="button"
              className={styles.chatInputButton}
              title="Add emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!isConnected || !conversationId}
            >
              <FontAwesomeIcon icon={faSmile} style={{ fontSize: 20 }} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !isConnected
                ? 'Connecting...'
                : !conversationId
                ? 'Preparing group chat...'
                : 'Type a message...'
            }
            className={styles.chatInputField}
            disabled={!isConnected || !conversationId}
          />

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!message.trim() || !isConnected || !conversationId}
          >
            <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 20 }} />
          </button>
        </form>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {!isConnected && (
          <div className={styles.connectionWarning}>
            Connecting to chat server...
          </div>
        )}
      </div>

      {/* Petit overlay pour ADD MEMBERS (inline, sans CSS global) */}
      {showAddMembersModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
          }}
          onClick={() => !processingAction && setShowAddMembersModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '16px',
              width: '360px',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Add members</h3>
            <p style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
              Select friends to add to this group.
            </p>

            {availableFriends.length === 0 ? (
              <p style={{ fontSize: '14px' }}>No available friends to add.</p>
            ) : (
              <div>
                {availableFriends.map((f) => (
                  <label
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedNewMembers.includes(f.id)}
                      onChange={() => toggleSelectNewMember(f.id)}
                    />
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '999px',
                        background: '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        fontSize: '14px'
                      }}
                    >
                      {f.avatar ? (
                        <img
                          src={f.avatar}
                          alt={getFriendDisplayName(f)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(getFriendDisplayName(f))
                      )}
                    </div>
                    <span style={{ fontSize: '14px' }}>{getFriendDisplayName(f)}</span>
                  </label>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px'
              }}
            >
              <button
                type="button"
                onClick={() => !processingAction && setShowAddMembersModal(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: processingAction ? 'not-allowed' : 'pointer'
                }}
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddMembers}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#b31217',
                  color: '#fff',
                  cursor:
                    processingAction || selectedNewMembers.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    processingAction || selectedNewMembers.length === 0 ? 0.6 : 1
                }}
                disabled={processingAction || selectedNewMembers.length === 0}
              >
                {processingAction ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
