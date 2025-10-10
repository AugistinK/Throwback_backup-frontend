// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { token, user } = useAuth();

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    if (!token || !user) {
      // Déconnecter si pas de token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🔌 Initializing Socket.IO connection...');

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Événement de connexion
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
      setIsConnected(true);
    });

    // Événement de déconnexion
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    // Événement d'erreur
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    // Liste des utilisateurs en ligne
    newSocket.on('online-users', (data) => {
      console.log('👥 Online users received:', data.count);
      setOnlineUsers(new Set(data.users));
    });

    // Changement de statut utilisateur
    newSocket.on('user-status-change', (data) => {
      console.log(`👤 User status changed: ${data.userId} is ${data.status}`);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    // Notifications de nouvelle demande d'ami
    newSocket.on('friend-request-received', (data) => {
      console.log('🤝 Friend request received from:', data.senderName);
      addNotification({
        type: 'friend-request',
        title: 'New Friend Request',
        message: `${data.senderName} sent you a friend request`,
        senderId: data.senderId,
        timestamp: data.timestamp
      });
    });

    // Demande acceptée
    newSocket.on('friend-request-was-accepted', (data) => {
      console.log('✅ Friend request accepted by:', data.acceptedBy);
      addNotification({
        type: 'friend-accepted',
        title: 'Friend Request Accepted',
        message: 'Your friend request was accepted!',
        userId: data.acceptedBy,
        timestamp: data.timestamp
      });
    });

    // Notification de nouveau message
    newSocket.on('new-message-notification', (data) => {
      console.log('💬 New message from:', data.senderName);
      addNotification({
        type: 'message',
        title: 'New Message',
        message: `${data.senderName}: ${data.content}`,
        senderId: data.senderId,
        timestamp: data.timestamp
      });
    });

    setSocket(newSocket);

    // Cleanup à la déconnexion
    return () => {
      console.log('🔌 Cleaning up Socket.IO connection');
      newSocket.disconnect();
    };
  }, [token, user]);

  // Fonction pour ajouter une notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [{
      id: Date.now(),
      ...notification,
      read: false
    }, ...prev].slice(0, 50)); // Garder max 50 notifications
  }, []);

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Fonction pour supprimer une notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Fonction pour vider toutes les notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Vérifier si un utilisateur est en ligne
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Envoyer un message
  const sendMessage = useCallback((receiverId, content, type = 'text', tempId = null) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      socket.emit('send-message', {
        receiverId,
        content,
        type,
        tempId: tempId || Date.now()
      });

      socket.once('message-sent', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socket.once('message-error', (data) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  }, [socket, isConnected]);

  // Rejoindre une conversation
  const joinConversation = useCallback((friendId) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', { friendId });
      console.log('👥 Joined conversation with:', friendId);
    }
  }, [socket, isConnected]);

  // Indicateur de saisie
  const startTyping = useCallback((receiverId) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { receiverId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((receiverId) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { receiverId });
    }
  }, [socket, isConnected]);

  // Marquer messages comme lus
  const markMessagesAsRead = useCallback((friendId) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', { friendId });
    }
  }, [socket, isConnected]);

  // Notifier demande d'ami envoyée
  const notifyFriendRequest = useCallback((receiverId, senderName) => {
    if (socket && isConnected) {
      socket.emit('friend-request-sent', { receiverId, senderName });
    }
  }, [socket, isConnected]);

  // Notifier demande acceptée
  const notifyFriendRequestAccepted = useCallback((requesterId) => {
    if (socket && isConnected) {
      socket.emit('friend-request-accepted', { requesterId });
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    isUserOnline,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    notifyFriendRequest,
    notifyFriendRequestAccepted,
    notifications,
    addNotification,
    markNotificationAsRead,
    removeNotification,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;