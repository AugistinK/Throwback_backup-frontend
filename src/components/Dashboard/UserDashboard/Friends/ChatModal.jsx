// src/components/Dashboard/UserDashboard/Friends/ChatModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { friendsAPI } from '../../../../utils/api';
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
  faTrash,
  faUserMinus,
  faFlag,
  faArchive
} from '@fortawesome/free-solid-svg-icons';

const ChatModal = ({ friend, onClose, onRemoveFriend }) => {
  const { socket, sendMessage: socketSendMessage, joinConversation, startTyping, stopTyping, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
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

  // Charger les messages initiaux
  useEffect(() => {
    loadMessages();
    
    if (isConnected && friend.id) {
      joinConversation(friend.id);
    }
  }, [friend.id, isConnected]);

  // Écouter les événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.message.sender._id === friend.id || data.message.receiver._id === friend.id) {
        setMessages(prev => [...prev, {
          id: data.message._id,
          sender: data.message.sender._id === friend.id ? 'them' : 'me',
          text: data.message.content,
          timestamp: formatTime(data.message.created_date),
          read: data.message.read,
          type: data.message.type
        }]);
      }
    };

    const handleMessageSent = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId 
          ? { ...msg, id: data.message._id, timestamp: formatTime(data.message.created_date) }
          : msg
      ));
    };

    const handleMessageError = (data) => {
      console.error('Message error:', data.error);
      setMessages(prev => prev.filter(msg => msg.tempId !== data.tempId));
      setConfirmModal({
        isOpen: true,
        type: 'error',
        data: {
          title: 'Message Error',
          message: `Failed to send message: ${data.error}`,
          showCancel: false,
          confirmText: 'OK'
        }
      });
    };

    const handleUserTyping = (data) => {
      if (data.userId === friend.id) {
        setIsOtherUserTyping(data.isTyping);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-error', handleMessageError);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-error', handleMessageError);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, friend.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getMessages(friend.id, page, 50);
      
      if (response.success) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg._id,
          sender: msg.sender._id === friend.id ? 'them' : 'me',
          text: msg.content,
          timestamp: formatTime(msg.created_date),
          read: msg.read,
          type: msg.type
        }));
        
        setMessages(prev => [...formattedMessages, ...prev]);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
      } else {
        console.error('Failed to load messages:', response.message);
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

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: null,
      tempId,
      sender: 'me',
      text: message,
      timestamp: formatTime(new Date()),
      read: false,
      type: 'text'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessage('');
    setShowEmojiPicker(false);

    try {
      await socketSendMessage(friend.id, message, 'text', tempId);
      try {
        await friendsAPI.sendMessage(friend.id, message, 'text'); 
      } catch (apiError) {
        console.log('Fallback API also failed:', apiError);
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

    if (isConnected && friend.id) {
      startTyping(friend.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(friend.id);
      }, 2000);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      data: {
        title: 'Clear Chat History',
        message: 'Are you sure you want to clear all messages with this user? This action cannot be undone.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        onConfirm: () => {
          setMessages([]);
          setConfirmModal({ isOpen: false, type: '', data: null });
          setShowOptionsMenu(false);
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
        message: `Are you sure you want to report ${friend.name}? Our moderation team will review this report.`,
        confirmText: 'Report',
        cancelText: 'Cancel',
        onConfirm: () => {
          // Logique de signalement ici
          setConfirmModal({
            isOpen: true,
            type: 'success',
            data: {
              title: 'Report Submitted',
              message: 'Thank you for your report. Our team will review it shortly.',
              showCancel: false,
              confirmText: 'OK'
            }
          });
          setShowOptionsMenu(false);
        }
      }
    });
  };

  const handleArchiveChat = () => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      data: {
        title: 'Archive Conversation',
        message: `Archive conversation with ${friend.name}? You can unarchive it later.`,
        confirmText: 'Archive',
        cancelText: 'Cancel',
        onConfirm: () => {
          // Logique d'archivage ici
          setConfirmModal({
            isOpen: true,
            type: 'success',
            data: {
              title: 'Conversation Archived',
              message: 'The conversation has been archived successfully.',
              showCancel: false,
              confirmText: 'OK'
            }
          });
          setShowOptionsMenu(false);
        }
      }
    });
  };

  const handleUnfriend = () => {
    setConfirmModal({
      isOpen: true,
      type: 'error',
      data: {
        title: 'Remove Friend',
        message: `Are you sure you want to remove ${friend.name} from your friends? You will no longer be able to chat with them.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        onConfirm: () => {
          if (onRemoveFriend) {
            onRemoveFriend(friend.id);
          }
          onClose();
        }
      }
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chatModal} onClick={(e) => e.stopPropagation()}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.chatAvatar}>
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} />
              ) : (
                <div className={styles.chatAvatarPlaceholder}>
                  {getInitials(friend.name)}
                </div>
              )}
              <span 
                className={styles.chatStatusDot}
                style={{
                  backgroundColor: friend.status === 'online' ? '#10b981' : '#9ca3af'
                }}
              />
            </div>
            <div className={styles.chatHeaderInfo}>
              <h3 className={styles.chatName}>{friend.name}</h3>
              <p className={styles.chatStatus}>
                {isOtherUserTyping ? (
                  <span className={styles.typingText}>typing...</span>
                ) : (
                  friend.status === 'online' ? 'Active now' : friend.lastActive
                )}
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
                      onClick={handleArchiveChat}
                    >
                      <FontAwesomeIcon icon={faArchive} style={{ fontSize: 16 }} />
                      Archive Chat
                    </button>
                    <button 
                      className={styles.chatOptionItem}
                      onClick={handleClearChat}
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: 16 }} />
                      Clear Chat History
                    </button>
                    <button 
                      className={styles.chatOptionItem}
                      onClick={handleReportUser}
                    >
                      <FontAwesomeIcon icon={faFlag} style={{ fontSize: 16 }} />
                      Report User
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button 
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={handleUnfriend}
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
          {loading && page === 1 && (
            <div className={styles.loadingMessages}>
              <div className={styles.spinner}></div>
            </div>
          )}
          
          {hasMore && !loading && (
            <button 
              className={styles.loadMoreButton}
              onClick={() => setPage(p => p + 1)}
            >
              Load more messages
            </button>
          )}

          {messages.map((msg, index) => (
            <div 
              key={msg.id || msg.tempId || index}
              className={`${styles.messageWrapper} ${
                msg.sender === 'me' ? styles.messageRight : styles.messageLeft
              }`}
            >
              {msg.sender === 'them' && (
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
              <div className={`${styles.messageBubble} ${msg.tempId ? styles.messageSending : ''}`}>
                <p className={styles.messageText}>{msg.text}</p>
                <span className={styles.messageTime}>
                  {msg.timestamp}
                  {msg.sender === 'me' && msg.read && ' ✓✓'}
                </span>
              </div>
            </div>
          ))}
          
          {isOtherUserTyping && (
            <div className={`${styles.messageWrapper} ${styles.messageLeft}`}>
              <div className={styles.messageAvatar}>
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.name} />
                ) : (
                  <div className={styles.miniAvatarPlaceholder}>
                    {getInitials(friend.name)}
                  </div>
                )}
              </div>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
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
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
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