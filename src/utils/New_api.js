// utils/api.js (section friendsAPI) - API COMPLÈTE POUR MESSAGERIE
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';

// Créer une instance axios avec les configurations par défaut
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const friendsAPI = {
  // ==================== CONVERSATIONS ====================
  
  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  getConversations: async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      return response;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // ==================== MESSAGES DIRECTS ====================
  
  /**
   * Récupérer les messages d'une conversation directe
   */
  getMessages: async (friendId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/messages/${friendId}`, {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message direct
   */
  sendMessage: async (receiverId, content, type = 'text') => {
    try {
      const response = await api.post('/api/messages', {
        receiverId,
        content,
        type
      });
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Marquer un message comme lu
   */
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/api/messages/${messageId}/read`);
      return response;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Éditer un message
   */
  editMessage: async (messageId, newContent) => {
    try {
      const response = await api.put(`/api/messages/${messageId}`, {
        content: newContent
      });
      return response;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  /**
   * Supprimer un message
   */
  deleteMessage: async (messageId, forEveryone = false) => {
    try {
      const response = await api.delete(`/api/messages/${messageId}`, {
        data: { forEveryone }
      });
      return response;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  /**
   * Obtenir le nombre de messages non lus
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messages/unread/count');
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Effacer l'historique de conversation
   */
  clearChatHistory: async (friendId) => {
    try {
      const response = await api.delete(`/api/messages/conversation/${friendId}`);
      return response;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  // ==================== GROUPES ====================
  
  /**
   * Créer un nouveau groupe
   */
  createGroup: async (name, participants, description = '') => {
    try {
      const response = await api.post('/api/groups', {
        name,
        participants,
        description
      });
      return response;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les groupes de l'utilisateur
   */
  getFriendGroups: async () => {
    try {
      const response = await api.get('/api/groups');
      return response;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails d'un groupe
   */
  getGroupDetails: async (groupId) => {
    try {
      const response = await api.get(`/api/groups/${groupId}`);
      return response;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'un groupe
   */
  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/groups/${groupId}/messages`, {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message dans un groupe
   */
  sendGroupMessage: async (groupId, content, type = 'text', replyTo = null) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/messages`, {
        content,
        type,
        replyTo
      });
      return response;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  },

  /**
   * Ajouter des membres à un groupe
   */
  addGroupMembers: async (groupId, userIds) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/members`, {
        userIds
      });
      return response;
    } catch (error) {
      console.error('Error adding group members:', error);
      throw error;
    }
  },

  /**
   * Retirer un membre d'un groupe
   */
  removeGroupMember: async (groupId, memberId) => {
    try {
      const response = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
      return response;
    } catch (error) {
      console.error('Error removing group member:', error);
      throw error;
    }
  },

  /**
   * Quitter un groupe
   */
  leaveGroup: async (groupId) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/leave`);
      return response;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  },

  /**
   * Supprimer un groupe
   */
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/api/groups/${groupId}`);
      return response;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour les informations du groupe
   */
  updateGroup: async (groupId, updates) => {
    try {
      const response = await api.put(`/api/groups/${groupId}`, updates);
      return response;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  /**
   * Promouvoir un membre en admin
   */
  promoteToAdmin: async (groupId, memberId) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/admins/${memberId}`);
      return response;
    } catch (error) {
      console.error('Error promoting to admin:', error);
      throw error;
    }
  },

  // ==================== AMIS ====================
  
  /**
   * Récupérer la liste des amis
   */
  getFriends: async () => {
    try {
      const response = await api.get('/api/friends');
      return response;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  },

  /**
   * Bloquer un utilisateur
   */
  blockUser: async (userId) => {
    try {
      const response = await api.post(`/api/friends/block/${userId}`);
      return response;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  /**
   * Débloquer un utilisateur
   */
  unblockUser: async (userId) => {
    try {
      const response = await api.delete(`/api/friends/block/${userId}`);
      return response;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  },

  /**
   * Obtenir la liste des utilisateurs bloqués
   */
  getBlockedUsers: async () => {
    try {
      const response = await api.get('/api/friends/blocked');
      return response;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  },

  /**
   * Rechercher des utilisateurs pour les ajouter à un groupe
   */
  searchUsers: async (query) => {
    try {
      const response = await api.get('/api/users/search', {
        params: { q: query }
      });
      return response;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};

export default api;