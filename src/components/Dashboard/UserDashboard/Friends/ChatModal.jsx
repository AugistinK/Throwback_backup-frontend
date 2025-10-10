// src/components/Dashboard/UserDashboard/Friends/ChatModal.jsx - VERSION SOCKET.IO
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Music, Image, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { useSocket } from '../../../../contexts/SocketContext';
import friendsService from '../../../../services/friendsService';
import styles from './Friends.module.css';

const ChatModal = ({ friend, onClose }) => {
  const { socket, sendMessage: socketSendMessage, joinConversation, startTyping, stopTyping, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
    
    // Rejoindre la conversation via Socket.IO
    if (isConnected && friend.id) {
      joinConversation(friend.id);
    }
  }, [friend.id, isConnected]);

  // Écouter les événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Nouveau message reçu
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

    // Message envoyé confirmé
    const handleMessageSent = (data) => {
      // Mettre à jour le message temporaire avec le vrai ID
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId 
          ? { ...msg, id: data.message._id, timestamp: formatTime(data.message.created_date) }
          : msg
      ));
    };

    // Erreur d'envoi de message
    const handleMessageError = (data) => {
      console.error('Message error:', data.error);
      // Supprimer le message temporaire
      setMessages(prev => prev.filter(msg => msg.tempId !== data.tempId));
      alert(`Error sending message: ${data.error}`);
    };

    // Indicateur de saisie
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
      const response = await friendsService.getMessages(friend.id, page, 50);
      
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

    // Ajouter le message de manière optimiste
    setMessages(prev => [...prev, optimisticMessage]);
    setMessage('');

    try {
      // Envoyer via Socket.IO
      await socketSendMessage(friend.id, message, 'text', tempId);
    } catch (err) {
      console.error('Error sending message:', err);
      // Le message sera supprimé par l'événement message-error
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

    // Indicateur de saisie
    if (isConnected && friend.id) {
      startTyping(friend.id);

      // Arrêter l'indicateur après 2 secondes d'inactivité
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(friend.id);
      }, 2000);
    }
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
            <button className={styles.chatActionButton} title="Voice call">
              <Phone size={20} />
            </button>
            <button className={styles.chatActionButton} title="Video call">
              <Video size={20} />
            </button>
            <button className={styles.chatActionButton} title="More options">
              <MoreVertical size={20} />
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={24} />
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
            <button type="button" className={styles.chatInputButton} title="Add music">
              <Music size={20} />
            </button>
            <button type="button" className={styles.chatInputButton} title="Add image">
              <Image size={20} />
            </button>
            <button type="button" className={styles.chatInputButton} title="Add emoji">
              <Smile size={20} />
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
            <Send size={20} />
          </button>
        </form>

        {!isConnected && (
          <div className={styles.connectionWarning}>
            ⚠️ Connecting to chat server...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModal;