// src/components/Dashboard/UserDashboard/Friends/GroupChatModal.jsx
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
  faUsers,
  faUserPlus,
  faTrash,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';

const GroupChatModal = ({ group, onClose, onUpdateGroup }) => {
  const { socket, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
  
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

  // Charger les messages du groupe
  useEffect(() => {
    loadGroupMessages();
    
    // Rejoindre le groupe via Socket.IO
    if (isConnected && group.id) {
      socket?.emit('join-group', { groupId: group.id });
    }

    return () => {
      if (socket && group.id) {
        socket.emit('leave-group', { groupId: group.id });
      }
    };
  }, [group.id, isConnected]);

  // Écouter les messages du groupe
  useEffect(() => {
    if (!socket) return;

    const handleGroupMessage = (data) => {
      if (data.groupId === group.id) {
        setMessages(prev => [...prev, {
          id: data.message._id,
          sender: data.message.sender,
          senderName: data.message.senderName,
          text: data.message.content,
          timestamp: formatTime(data.message.created_date),
          type: data.message.type
        }]);
      }
    };

    socket.on('group-message', handleGroupMessage);

    return () => {
      socket.off('group-message', handleGroupMessage);
    };
  }, [socket, group.id]);

  const loadGroupMessages = async () => {
    try {
      setLoading(true);
      // API call pour charger les messages du groupe
      // const response = await friendsAPI.getGroupMessages(group.id);
      
      // Simulation avec des données factices
      const mockMessages = [
        {
          id: 1,
          sender: 'user1',
          senderName: 'John Doe',
          text: 'Hey everyone! 👋',
          timestamp: '10:30 AM',
          type: 'text'
        },
        {
          id: 2,
          sender: 'user2',
          senderName: 'Jane Smith',
          text: 'Hi! How are you?',
          timestamp: '10:32 AM',
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
    } catch (err) {
      console.error('Error loading group messages:', err);
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
      id: tempId,
      sender: 'me',
      senderName: 'You',
      text: message,
      timestamp: formatTime(new Date()),
      type: 'text'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessage('');
    setShowEmojiPicker(false);

    try {
      // Envoyer via Socket.IO
      socket?.emit('group-message', {
        groupId: group.id,
        content: message,
        type: 'text',
        tempId
      });

      // Fallback API
      // await friendsAPI.sendGroupMessage(group.id, message, 'text');
    } catch (err) {
      console.error('Error sending group message:', err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleAddMembers = () => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      data: {
        title: 'Add Members',
        message: 'Select friends to add to this group.',
        showCancel: true,
        confirmText: 'Add',
        onConfirm: () => {
          // Logique pour ajouter des membres
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
          // Logique pour quitter le groupe
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
          // Logique pour supprimer le groupe
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
            <div className={styles.chatAvatar} style={{ backgroundColor: group.color || '#b31217' }}>
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: 24, color: 'white' }} />
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
                      onClick={handleAddMembers}
                    >
                      <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 16 }} />
                      Add Members
                    </button>
                    <button 
                      className={styles.chatOptionItem}
                      onClick={() => {
                        setShowOptionsMenu(false);
                        // Ouvrir modal de gestion des membres
                      }}
                    >
                      <FontAwesomeIcon icon={faUsers} style={{ fontSize: 16 }} />
                      View Members
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button 
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={handleLeaveGroup}
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 16 }} />
                      Leave Group
                    </button>
                    {/* Only show delete if user is group creator */}
                    {group.isCreator && (
                      <button 
                        className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                        onClick={handleDeleteGroup}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 16 }} />
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

          {messages.map((msg, index) => (
            <div 
              key={msg.id || index}
              className={`${styles.messageWrapper} ${
                msg.sender === 'me' ? styles.messageRight : styles.messageLeft
              }`}
            >
              {msg.sender !== 'me' && (
                <div className={styles.messageAvatar}>
                  <div className={styles.miniAvatarPlaceholder}>
                    {getInitials(msg.senderName)}
                  </div>
                </div>
              )}
              <div className={styles.messageBubble}>
                {msg.sender !== 'me' && (
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

export default GroupChatModal;