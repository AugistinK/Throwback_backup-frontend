// src/components/Dashboard/UserDashboard/Friends/ChatModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Music, Image, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import styles from './Friends.module.css';

const ChatModal = ({ friend, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'them',
      text: 'Hey! Have you heard the new playlist?',
      timestamp: '10:30 AM',
      read: true
    },
    {
      id: 2,
      sender: 'me',
      text: 'Not yet! Is it good?',
      timestamp: '10:32 AM',
      read: true
    },
    {
      id: 3,
      sender: 'them',
      text: "It's amazing! Full of 80s classics 🎵",
      timestamp: '10:33 AM',
      read: true
    },
    {
      id: 4,
      sender: 'me',
      text: "I'll check it out right now!",
      timestamp: '10:35 AM',
      read: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'me',
        text: message,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        read: false
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // Simuler une réponse
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const response = {
            id: messages.length + 2,
            sender: 'them',
            text: 'That sounds great! 😊',
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            read: true
          };
          setMessages(prev => [...prev, response]);
        }, 2000);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
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
                {friend.status === 'online' ? 'Active now' : friend.lastActive}
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
          {messages.map((msg) => (
            <div 
              key={msg.id}
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
              <div className={styles.messageBubble}>
                <p className={styles.messageText}>{msg.text}</p>
                <span className={styles.messageTime}>{msg.timestamp}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
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
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.chatInputField}
          />
          
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={!message.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;