// src/hooks/useMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import friendsService from '../services/friendsService';

/**
 * Hook personnalisé pour gérer les messages en temps réel
 * @param {string} friendId - ID de l'ami avec qui on converse
 * @returns {object} État et méthodes pour gérer les messages
 */
export const useMessages = (friendId) => {
  const { 
    socket, 
    sendMessage: socketSendMessage, 
    joinConversation,
    startTyping,
    stopTyping,
    isConnected
  } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);

  /**
   * Charger les messages initiaux
   */
  const loadMessages = useCallback(async (pageNum = 1) => {
    if (!friendId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await friendsService.getMessages(friendId, pageNum, 50);
      
      if (response.success) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg._id,
          sender: msg.sender._id === friendId ? 'them' : 'me',
          text: msg.content,
          timestamp: new Date(msg.created_date),
          read: msg.read,
          type: msg.type || 'text',
          mediaUrl: msg.mediaUrl,
          metadata: msg.musicData
        }));

        if (pageNum === 1) {
          setMessages(formattedMessages);
        } else {
          setMessages(prev => [...formattedMessages, ...prev]);
        }

        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  /**
   * Charger les messages initiaux au montage
   */
  useEffect(() => {
    if (friendId) {
      loadMessages(1);
      
      if (isConnected) {
        joinConversation(friendId);
      }
    }

    return () => {
      setMessages([]);
      setPage(1);
      setHasMore(true);
    };
  }, [friendId, isConnected]);

  /**
   * Écouter les événements Socket.IO
   */
  useEffect(() => {
    if (!socket || !friendId) return;

    // Nouveau message reçu
    const handleNewMessage = (data) => {
      if (data.message.sender._id === friendId || data.message.receiver._id === friendId) {
        const newMessage = {
          id: data.message._id,
          sender: data.message.sender._id === friendId ? 'them' : 'me',
          text: data.message.content,
          timestamp: new Date(data.message.created_date),
          read: data.message.read,
          type: data.message.type || 'text',
          mediaUrl: data.message.mediaUrl,
          metadata: data.message.musicData
        };

        setMessages(prev => [...prev, newMessage]);
        lastMessageRef.current = newMessage;

        // Marquer comme lu si on est l'expéditeur
        if (newMessage.sender === 'me') {
          markAsRead();
        }
      }
    };

    // Message envoyé confirmé
    const handleMessageSent = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId 
          ? { ...msg, id: data.message._id, timestamp: new Date(data.message.created_date), sending: false }
          : msg
      ));
      setSending(false);
    };

    // Erreur d'envoi
    const handleMessageError = (data) => {
      console.error('Message error:', data.error);
      setMessages(prev => prev.filter(msg => msg.tempId !== data.tempId));
      setError(`Failed to send message: ${data.error}`);
      setSending(false);
    };

    // Indicateur de saisie
    const handleUserTyping = (data) => {
      if (data.userId === friendId) {
        setIsTyping(data.isTyping);
      }
    };

    // Messages marqués comme lus
    const handleMessagesRead = (data) => {
      if (data.readerId === friendId) {
        setMessages(prev => prev.map(msg => 
          msg.sender === 'me' ? { ...msg, read: true } : msg
        ));
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-error', handleMessageError);
    socket.on('user-typing', handleUserTyping);
    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-error', handleMessageError);
      socket.off('user-typing', handleUserTyping);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, friendId]);

  /**
   * Envoyer un message
   */
  const sendMessage = useCallback(async (content, type = 'text', metadata = null) => {
    if (!content.trim() || !isConnected || !friendId || sending) return;

    setSending(true);
    setError(null);

    const tempId = Date.now();
    const optimisticMessage = {
      id: null,
      tempId,
      sender: 'me',
      text: content,
      timestamp: new Date(),
      read: false,
      type,
      metadata,
      sending: true
    };

    // Ajouter de manière optimiste
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await socketSendMessage(friendId, content, type, tempId);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      setSending(false);
    }
  }, [friendId, isConnected, sending, socketSendMessage]);

  /**
   * Notifier que l'utilisateur tape
   */
  const notifyTyping = useCallback(() => {
    if (!isConnected || !friendId) return;

    startTyping(friendId);

    // Arrêter après 2 secondes d'inactivité
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(friendId);
    }, 2000);
  }, [friendId, isConnected, startTyping, stopTyping]);

  /**
   * Arrêter la notification de saisie
   */
  const stopNotifyTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isConnected && friendId) {
      stopTyping(friendId);
    }
  }, [friendId, isConnected, stopTyping]);

  /**
   * Marquer les messages comme lus
   */
  const markAsRead = useCallback(async () => {
    if (!friendId) return;

    try {
      await friendsService.markMessagesAsRead(friendId);
      setMessages(prev => prev.map(msg => 
        msg.sender === 'them' ? { ...msg, read: true } : msg
      ));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [friendId]);

  /**
   * Charger plus de messages (pagination)
   */
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  }, [hasMore, loading, page, loadMessages]);

  /**
   * Supprimer un message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await friendsService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  }, []);

  /**
   * Calculer le nombre de messages non lus
   */
  useEffect(() => {
    const count = messages.filter(msg => msg.sender === 'them' && !msg.read).length;
    setUnreadCount(count);
  }, [messages]);

  /**
   * Nettoyer les timeouts au démontage
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // État
    messages,
    loading,
    sending,
    error,
    isTyping,
    hasMore,
    unreadCount,
    isConnected,

    // Actions
    sendMessage,
    notifyTyping,
    stopNotifyTyping,
    markAsRead,
    loadMore,
    deleteMessage,
    refresh: () => loadMessages(1)
  };
};

/**
 * Hook pour gérer les conversations
 */
export const useConversations = () => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);

  /**
   * Charger les conversations
   */
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await friendsService.getConversations();
      
      if (response.success) {
        setConversations(response.data);
        
        // Calculer le total des messages non lus
        const unreadTotal = response.data.reduce((sum, conv) => sum + conv.unreadCount, 0);
        setTotalUnread(unreadTotal);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger au montage
   */
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Écouter les nouveaux messages pour mettre à jour les conversations
   */
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      loadConversations();
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, loadConversations]);

  return {
    conversations,
    loading,
    error,
    totalUnread,
    refresh: loadConversations
  };
};

export default useMessages;