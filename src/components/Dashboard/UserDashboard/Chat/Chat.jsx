// src/components/Dashboard/UserDashboard/Chat/Chat.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ConversationSidebar from './ConversationSidebar';
import ChatArea from './ChatArea';
import EmptyChat from './EmptyChat';
import styles from './Chat.module.css';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, favorites, groups
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Écouter les nouveaux messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Mettre à jour la conversation avec le nouveau message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.participant._id === data.message.sender._id || 
              conv.participant._id === data.message.receiver._id) {
            return {
              ...conv,
              lastMessage: data.message,
              unreadCount: conv.participant._id === data.message.sender._id 
                ? conv.unreadCount + 1 
                : conv.unreadCount
            };
          }
          return conv;
        });
        
        // Trier par date du dernier message
        return updated.sort((a, b) => 
          new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
        );
      });
      
      // Mettre à jour le compteur de messages non lus
      if (data.message.receiver._id === user.id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessageSent = (data) => {
      // Mettre à jour la conversation après envoi
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.participant._id === data.message.receiver._id) {
            return {
              ...conv,
              lastMessage: data.message
            };
          }
          return conv;
        });
        
        return updated.sort((a, b) => 
          new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
        );
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
    };
  }, [socket, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getConversations();
      
      if (response.success) {
        setConversations(response.data);
        
        // Calculer le nombre total de messages non lus
        const total = response.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    // Marquer les messages comme lus
    if (conversation.unreadCount > 0) {
      setConversations(prev => prev.map(conv => 
        conv.participant._id === conversation.participant._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      setUnreadCount(prev => Math.max(0, prev - conversation.unreadCount));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    // Filtre par recherche
    const matchesSearch = !searchQuery || 
      conv.participant.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filtre par onglet
    switch (activeTab) {
      case 'unread':
        return conv.unreadCount > 0;
      case 'favorites':
        return conv.isFavorite;
      case 'groups':
        return conv.isGroup;
      default:
        return true;
    }
  });

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar des conversations */}
      <ConversationSidebar
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadCount={unreadCount}
        loading={loading}
        onlineUsers={onlineUsers}
      />

      {/* Zone de chat principale */}
      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
          isOnline={onlineUsers.has(selectedConversation.participant._id)}
        />
      ) : (
        <EmptyChat />
      )}
    </div>
  );
};

export default Chat;