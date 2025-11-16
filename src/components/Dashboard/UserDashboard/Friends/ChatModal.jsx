// src/components/Dashboard/UserDashboard/Friends/ChatModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { friendsAPI } from '../../../../utils/api';
import MessageContextMenu from './MessageContextMenu';
import EmojiPicker from './EmojiPicker';
import ConfirmModal from './ConfirmModal';
import styles from './Friends.module.css';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPaperPlane,
  faSmile,
  faEllipsisVertical,
  faTrash,
  faFlag,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

const ChatModal = ({ friend, onClose, onRemoveFriend }) => {
  const {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    markMessagesAsRead
  } = useSocket();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [typing, setTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Charger les messages
  useEffect(() => {
    loadMessages();
    if (isConnected) {
      joinConversation(friend.id);
    }
  }, [friend.id, isConnected]);

  // Écouter les nouveaux messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Afficher nos messages ET ceux de l’ami
      const senderId = data.message?.sender?._id || data.message?.sender;
      const receiverId = data.message?.receiver?._id || data.message?.receiver;
      if (senderId === friend.id || receiverId === friend.id) {
        setMessages((prev) => [...prev, formatMessage(data.message)]);
        markMessagesAsRead(friend.id);
      }
    };

    const handleMessageEdited = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, text: data.content, edited: true, editedAt: data.editedAt }
            : msg
        )
      );
    };

    const handleMessageDeleted = (data) => {
      if (data.deletedForEveryone) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, deleted: true, text: 'This message was deleted' }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId === friend.id) {
        setTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setTyping(false), 3000);
        }
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, friend.id]);

  const formatMessage = (msg) => ({
    id: msg._id,
    sender: msg.sender?._id || msg.sender,
    senderName: msg.sender?.nom ? `${msg.sender?.prenom} ${msg.sender?.nom}` : 'Unknown',
    text: msg.content,
    timestamp: formatTime(msg.created_date || msg.createdAt || Date.now()),
    type: msg.type,
    edited: msg.edited || false,
    editedAt: msg.editedAt,
    deleted: msg.deleted || false,
    forwarded: msg.forwarded || false,
    replyTo: msg.replyTo
  });

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getMessages(friend.id);
      if (response?.success) {
        const formattedMessages = (response.data?.messages || []).map(formatMessage);
        setMessages(formattedMessages);
        markMessagesAsRead(friend.id);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fallback d'avatar (initiales)
  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    const content = message.trim();
    setMessage('');
    setShowEmojiPicker(false);
    stopTyping(friend.id);

    try {
      if (editingMessage) {
        await friendsAPI.editMessage(editingMessage.id, content);
        setEditingMessage(null);
      } else {
        // Envoi serveur
        await sendMessage(friend.id, content, 'text');

        // ✅ APPEND OPTIMISTE : on ajoute immédiatement notre message
        const localMsg = {
          id: `local-${Date.now()}`,
          sender: 'self',
          senderName: 'You',
          text: content,
          timestamp: formatTime(Date.now()),
          type: 'text',
          edited: false,
          deleted: false,
          forwarded: false,
          replyTo: null
        };
        setMessages((prev) => [...prev, localMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
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

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!typing && e.target.value) {
      startTyping(friend.id);
      setTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(friend.id);
      setTyping(false);
    }, 1000);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Actions sur les messages
  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setMessage(msg.text);
    inputRef.current?.focus();
  };

  const handleCopy = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setConfirmModal({
        isOpen: true,
        type: 'success',
        data: {
          title: 'Copied!',
          message: 'Message copied to clipboard',
          showCancel: false,
          confirmText: 'OK'
        }
      });
    } catch (err) {
      console.error('Error copying message:', err);
    }
  };

  const handleDelete = (msg, isOwnMessage) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Delete Message',
        message: isOwnMessage
          ? 'Delete this message for everyone? This cannot be undone.'
          : 'Delete this message for you?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await friendsAPI.deleteMessage(msg.id, isOwnMessage);
            if (isOwnMessage) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msg.id
                    ? { ...m, deleted: true, text: 'This message was deleted' }
                    : m
                )
              );
            } else {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            }
          } catch (err) {
            console.error('Error deleting message:', err);
          }
        }
      }
    });
  };

  // Actions de chat
  const handleClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Clear Chat History',
        message: 'Delete all messages in this conversation? This cannot be undone.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await friendsAPI.clearChatHistory(friend.id);
            setMessages([]);
            setConfirmModal({
              isOpen: true,
              type: 'success',
              data: {
                title: 'Chat Cleared',
                message: 'Chat history has been cleared.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          } catch (err) {
            console.error('Error clearing history:', err);
          }
        }
      }
    });
  };

  const handleReportUser = () => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Report User',
        message: 'Report this user for inappropriate behavior?',
        confirmText: 'Report',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await friendsAPI.reportUser(
              friend.id,
              'inappropriate_content',
              'Reported from chat'
            );
            setConfirmModal({
              isOpen: true,
              type: 'success',
              data: {
                title: 'Report Sent',
                message: 'Thank you for your report. We will review it shortly.',
                showCancel: false,
                confirmText: 'OK'
              }
            });
          } catch (err) {
            console.error('Error reporting user:', err);
          }
        }
      }
    });
  };

  const handleRemoveFriend = () => {
    setConfirmModal({
      isOpen: true,
      type: 'error',
      data: {
        title: 'Remove Friend',
        message: `Remove ${friend.name} from your friends? This will also archive your conversation.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        onConfirm: () => {
          onRemoveFriend(friend.id);
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
            <div className={styles.chatAvatar}>
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} />
              ) : (
                <div className={styles.chatAvatarPlaceholder}>
                  {friend.name.charAt(0)}
                </div>
              )}
              <span
                className={styles.statusDot}
                style={{
                  backgroundColor:
                    friend.status === 'online' ? '#10b981' : '#9ca3af'
                }}
              />
            </div>
            <div className={styles.chatHeaderInfo}>
              <h3 className={styles.chatName}>{friend.name}</h3>
              <p className={styles.chatStatus}>
                {typing
                  ? 'typing...'
                  : friend.status === 'online'
                  ? 'Active now'
                  : friend.lastActive}
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
                <FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize: 20 }} />
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
                      onClick={handleClearHistory}
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: 16 }} />
                      Clear Chat History
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={handleReportUser}
                    >
                      <FontAwesomeIcon icon={faFlag} style={{ fontSize: 16 }} />
                      Report User
                    </button>
                    <button
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={handleRemoveFriend}
                    >
                      <FontAwesomeIcon icon={faUserMinus} style={{ fontSize: 16 }} />
                      Remove Friend
                    </button>
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

          {/* Edit indicator */}
          {editingMessage && (
            <div className={styles.editIndicator}>
              <span>Editing message</span>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setMessage('');
                }}
              >
                ×
              </button>
            </div>
          )}

          {messages.map((msg, index) => {
            const isOwnMessage = msg.sender !== friend.id;
            return (
              <div
                key={msg.id || index}
                className={`${styles.messageWrapper} ${
                  isOwnMessage ? styles.messageRight : styles.messageLeft
                }`}
              >
                {/* Avatar à côté des messages de l'ami */}
                {!isOwnMessage && (
                  <div className={styles.messageAvatar}>
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} />
                    ) : (
                      <div className={styles.miniAvatarPlaceholder}>
                        {getInitials(friend.name)}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.messageBubble}>
                  {msg.replyTo && (
                    <div className={styles.messageReply}>
                      <small>Reply to previous message</small>
                    </div>
                  )}

                  {msg.deleted ? (
                    <p className={styles.messageDeleted}>
                      <em>{msg.text}</em>
                    </p>
                  ) : (
                    <>
                      <p className={styles.messageText}>{msg.text}</p>
                      <div className={styles.messageFooter}>
                        <span className={styles.messageTime}>
                          {msg.timestamp}
                          {msg.edited && (
                            <em className={styles.editedLabel}> (edited)</em>
                          )}
                        </span>
                        {!msg.deleted && (
                          <MessageContextMenu
                            message={msg}
                            isOwnMessage={isOwnMessage}
                            onEdit={handleEdit}
                            onCopy={handleCopy}
                            onDelete={handleDelete}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

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
            >
              <FontAwesomeIcon icon={faSmile} style={{ fontSize: 20 }} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              isConnected
                ? editingMessage
                  ? 'Edit your message...'
                  : 'Type a message...'
                : 'Connecting...'
            }
            className={styles.chatInputField}
            disabled={!isConnected}
          />

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!message.trim() || !isConnected}
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
            ⚠️ Connecting to chat server...
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', data: null })}
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

export default ChatModal;
