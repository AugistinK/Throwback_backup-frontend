// src/components/Dashboard/UserDashboard/Chat/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './Chat.module.css';

const ChatArea = ({ conversation, onBack, isOnline }) => {
  const { user } = useAuth();
  const { socket, sendMessage: socketSendMessage, joinConversation, markMessagesAsRead } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { participant } = conversation;

  // Charger les messages
  useEffect(() => {
    if (participant) {
      loadMessages();
      
      // Rejoindre la conversation via Socket.IO
      if (socket) {
        joinConversation(participant._id);
        
        // Marquer les messages comme lus
        markMessagesAsRead(participant._id);
      }
    }
  }, [participant, socket]);

  // Écouter les événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.message.sender._id === participant._id || 
          data.message.receiver._id === participant._id) {
        setMessages(prev => [...prev, {
          id: data.message._id,
          sender: data.message.sender,
          receiver: data.message.receiver,
          content: data.message.content,
          type: data.message.type,
          created_date: data.message.created_date,
          read: data.message.read
        }]);
        
        // Auto-scroll vers le bas
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageSent = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId 
          ? { ...msg, id: data.message._id, created_date: data.message.created_date }
          : msg
      ));
    };

    const handleUserTyping = (data) => {
      if (data.userId === participant._id) {
        setIsTyping(data.isTyping);
        
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, participant]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getMessages(participant._id, page, 50);
      
      if (response.success) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          content: msg.content,
          type: msg.type,
          created_date: msg.created_date,
          read: msg.read
        }));
        
        setMessages(formattedMessages);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        
        // Scroll vers le bas après chargement
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, type = 'text') => {
    if (!content.trim()) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: null,
      tempId,
      sender: user,
      receiver: participant,
      content,
      type,
      created_date: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      await socketSendMessage(participant._id, content, type, tempId);
    } catch (err) {
      console.error('Error sending message:', err);
      // Retirer le message optimiste en cas d'erreur
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(p => p + 1);
    }
  };

  return (
    <div className={styles.chatArea}>
      <ChatHeader 
        participant={participant}
        isOnline={isOnline}
        onBack={onBack}
      />
      
      <MessageList 
        messages={messages}
        currentUser={user}
        isTyping={isTyping}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        participant={participant}
        messagesEndRef={messagesEndRef}
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        receiverId={participant._id}
      />
    </div>
  );
};

export default ChatArea;