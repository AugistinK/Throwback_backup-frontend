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

const GroupChatModal = ({ group, onClose, onUpdateGroup }) => {
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

        const serverData = response.data;
        let rawMessages = [];

        if (Array.isArray(serverData)) {
          rawMessages = serverData;
        } else if (serverData && Array.isArray(serverData.messages)) {
          rawMessages = serverData.messages;
        } else if (serverData?.data && Array.isArray(serverData.data.messages)) {
          rawMessages = serverData.data.messages;
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

    // Rejoindre le groupe via Socket.IO
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

  const handleAddMembers = () => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      data: {
        title: 'Add Members',
        message: 'Select friends to add to this group (UI to implement).',
        showCancel: true,
        confirmText: 'OK',
        onConfirm: () => {
          setShowOptionsMenu(false);
        }
      }
    });
  };

  const handleLeaveGroup = () => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Leave Group',
        message: `Are you sure you want to leave "${group.name}"? You'll no longer receive messages from this group.`,
        confirmText: 'Leave',
        cancelText: 'Cancel',
        onConfirm: () => {
          // TODO: appeler conversationsController.removeParticipant côté API si nécessaire
          onClose();
        }
      }
    });
  };

  const handleDeleteGroup = () => {
    setConfirmModal({
      isOpen: true,
      type: 'error',
      data: {
        title: 'Delete Group',
        message: `Are you sure you want to delete "${group.name}"? This action cannot be undone and all messages will be lost.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
          // TODO: endpoint dédié pour supprimer un groupe de conversation si tu le prévois
          onClose();
        }
      }
    });
  };

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
              <h3 className={styles.chatName}>{group.name}</h3>
              <p className={styles.chatStatus}>
                {group.members?.length || 0} members
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
                      onClick={() => {
                        setShowOptionsMenu(false);
                        // TODO: ouvrir un modal "view members"
                      }}
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
