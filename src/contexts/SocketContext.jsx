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

  // Fonction pour ajouter une notification locale (toasts, etc.)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [{
      id: Date.now(),
      ...notification,
      read: false
    }, ...prev].slice(0, 50));
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    if (!token || !user) {
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

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('online-users', (data) => {
      console.log('👥 Online users received:', data.count);
      setOnlineUsers(new Set(data.users));
    });

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

    // 👉 Nouveau : notifications persistantes unifiées
    newSocket.on('notification:new', (notif) => {
      console.log('🔔 Real-time notification received:', notif.title);
      addNotification({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        senderId: notif.actor,
        timestamp: notif.createdAt,
        backendId: notif.id
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up Socket.IO connection');
      newSocket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]); // addNotification est stable (useCallback sans dépendances)

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

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

  const joinConversation = useCallback((friendId) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', { friendId });
      console.log('👥 Joined conversation with:', friendId);
    }
  }, [socket, isConnected]);

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

  const markMessagesAsRead = useCallback((friendId) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', { friendId });
    }
  }, [socket, isConnected]);

  const notifyFriendRequest = useCallback((receiverId, senderName) => {
    if (socket && isConnected) {
      socket.emit('friend-request-sent', { receiverId, senderName });
    }
  }, [socket, isConnected]);

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
