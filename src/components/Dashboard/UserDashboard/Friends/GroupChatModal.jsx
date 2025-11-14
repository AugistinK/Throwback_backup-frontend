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

  // ID du "Friend Group" (organisation) - peut être utile plus tard
  const friendGroupId = group?._id || group?.id || null;

  // ID de la conversation de groupe réelle (modèle Conversation)
  const initialConversationId =
    group?.conversationId ||
    group?.chatConversationId ||
    (group?.conversation && (group.conversation._id || group.conversation.id)) ||
    null;

  const [conversationId, setConversationId] = useState(initialConversationId);

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
   * 🔁 Étape 1 : s'assurer qu'on a bien un ID de conversation de groupe
   * - si group.conversationId existe -> on l'utilise
   * - sinon on cherche une conversation de type "group" avec le même nom
   * - sinon on crée une nouvelle conversation de groupe
   */
  useEffect(() => {
    const ensureConversation = async () => {
      if (!group || !currentUserId) {
        setLoading(false);
        return;
      }

      // Déjà résolu
      if (conversationId) {
        return;
      }

      try {
        const groupName = group.name || group.groupName || 'Group';

        // 1) Essayer de trouver une conversation de type "group" existante
        if (typeof friendsAPI.getAllConversations === 'function') {
          const res = await friendsAPI.getAllConversations();
          if (res?.success && Array.isArray(res.data)) {
            const existing = res.data.find((conv) => {
              if (conv.type !== 'group') return false;
              if (!conv.groupName) return false;
              if (conv.groupName !== groupName) return false;
              // S'assurer que l'utilisateur actuel est dedans
              const participantIds = (conv.participants || []).map((p) =>
                String(p._id || p.id || p)
              );
              return participantIds.includes(String(currentUserId));
            });

            if (existing) {
              const id = existing._id || existing.id;
              setConversationId(id);
              if (onUpdateGroup) {
                onUpdateGroup({
                  ...group,
                  conversationId: id
                });
              }
              return;
            }
          }
        }

        // 2) Sinon, créer une nouvelle conversation de groupe
        const baseMembers = Array.isArray(group.members) ? [...group.members] : [];
        const currentIdStr = String(currentUserId);
        if (!baseMembers.some((id) => String(id) === currentIdStr)) {
          baseMembers.push(currentUserId);
        }

        const createRes = await friendsAPI.createGroup(groupName, baseMembers, null);

        if (!createRes?.success || !createRes.data) {
          console.error('Error creating group conversation:', createRes?.message);
          setLoading(false);
          return;
        }

        const newConv = createRes.data;
        const newId = newConv._id || newConv.id;

        setConversationId(newId);

        if (onUpdateGroup) {
          onUpdateGroup({
            ...group,
            conversationId: newId
          });
        }
      } catch (err) {
        console.error('Error resolving group conversation:', err);
        setLoading(false);
      }
    };

    ensureConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, currentUserId, conversationId]);

  /**
   * 🔁 Étape 2 : charger les messages une fois qu'on a conversationId
   * et rejoindre le groupe via Socket.IO
   */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        setLoading(true);
        const response = await friendsAPI.getGroupMessages(conversationId);

        if (!response?.success) {
          console.error('Error loading group messages:', response?.message);
          setMessages([]);
          setLoading(false);
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
   * 🔁 Étape 3 : écouter les messages temps réel pour cette conversation
   */
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleGroupMessage = (data) => {
      const incomingGroupId =
        data.groupId || data.group_id || data.group?._id || data.group?.id;

      if (!incomingGroupId || String(incomingGroupId) !== String(conversationId)) {
        return;
      }

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

    // Si la conversation n'est pas encore prête, on bloque l'envoi
    if (!conversationId) {
      console.error('Missing group conversation id, cannot send message.');
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

      // Optionnel : émettre aussi via socket si le backend n'émet pas après la création
      if (socket && isConnected) {
        socket.emit('group-message', {
          groupId: conversationId,
          message: apiMessage || {
            content: contentToSend,
            sender: currentUserId,
            type: 'text',
            created_date: new Date()
          }
        });
      }
    } catch (err) {
      console.error('Error sending group message:', err);
      // Retirer l’optimistic message en cas d’erreur
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
          // TODO: ouvrir un modal de sélection de membres
          // et utiliser friendsAPI.addParticipantToGroup(conversationId, memberId)
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
          // TODO: appeler friendsAPI.removeParticipantFromGroup(conversationId, currentUserId)
          onClose();
        }
      }
    });
  };

  const handleDeleteGroup = () => {
    if (!conversationId && !friendGroupId) return;

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
          if (onUpdateGroup) {
            onUpdateGroup();
          }
          onClose();
        }
      }
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chatModal} onClick={(e) => e.stopPropagation()}>
        {/* Group Header */}
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
                        // TODO: ouvrir modal "view members"
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
                    {/* Only show delete if user is group creator */}
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

        {/* Messages Area */}
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

        {/* Input Area */}
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
