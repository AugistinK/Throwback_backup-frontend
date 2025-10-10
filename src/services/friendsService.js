// src/services/friendsService.js
import api from '../utils/api';

/**
 * Service pour gérer toutes les interactions avec l'API Friends
 */
const friendsService = {
  /**
   * Récupérer tous les amis de l'utilisateur connecté
   * @returns {Promise} Liste des amis
   */
  getFriends: async () => {
    try {
      const response = await api.get('/api/friends');
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  },

  /**
   * Récupérer les demandes d'amis en attente
   * @returns {Promise} Liste des demandes
   */
  getFriendRequests: async () => {
    try {
      const response = await api.get('/api/friends/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      throw error;
    }
  },

  /**
   * Récupérer les suggestions d'amis
   * @returns {Promise} Liste des suggestions
   */
  getFriendSuggestions: async () => {
    try {
      const response = await api.get('/api/friends/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      throw error;
    }
  },

  /**
   * Envoyer une demande d'ami
   * @param {string} friendId - ID de l'utilisateur à ajouter
   * @returns {Promise} Résultat de l'opération
   */
  sendFriendRequest: async (friendId) => {
    try {
      const response = await api.post('/api/friends/request', { friendId });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  /**
   * Accepter une demande d'ami
   * @param {string} friendshipId - ID de la demande d'amitié
   * @returns {Promise} Résultat de l'opération
   */
  acceptFriendRequest: async (friendshipId) => {
    try {
      const response = await api.put(`/api/friends/accept/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  /**
   * Refuser une demande d'ami
   * @param {string} friendshipId - ID de la demande d'amitié
   * @returns {Promise} Résultat de l'opération
   */
  rejectFriendRequest: async (friendshipId) => {
    try {
      const response = await api.delete(`/api/friends/reject/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  /**
   * Retirer un ami
   * @param {string} friendId - ID de l'ami à retirer
   * @returns {Promise} Résultat de l'opération
   */
  removeFriend: async (friendId) => {
    try {
      const response = await api.delete(`/api/friends/remove/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  /**
   * Bloquer un utilisateur
   * @param {string} userId - ID de l'utilisateur à bloquer
   * @returns {Promise} Résultat de l'opération
   */
  blockUser: async (userId) => {
    try {
      const response = await api.post('/api/friends/block', { userId });
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  /**
   * Débloquer un utilisateur
   * @param {string} userId - ID de l'utilisateur à débloquer
   * @returns {Promise} Résultat de l'opération
   */
  unblockUser: async (userId) => {
    try {
      const response = await api.delete(`/api/friends/unblock/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  },

  /**
   * Récupérer les utilisateurs bloqués
   * @returns {Promise} Liste des utilisateurs bloqués
   */
  getBlockedUsers: async () => {
    try {
      const response = await api.get('/api/friends/blocked');
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  },

  /**
   * Rechercher des utilisateurs
   * @param {string} query - Terme de recherche
   * @returns {Promise} Liste des utilisateurs trouvés
   */
  searchUsers: async (query) => {
    try {
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  /**
   * Récupérer les amis mutuels avec un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Liste des amis mutuels
   */
  getMutualFriends: async (userId) => {
    try {
      const response = await api.get(`/api/friends/mutual/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      throw error;
    }
  },

  // ===== Gestion des groupes d'amis =====

  /**
   * Récupérer tous les groupes d'amis
   * @returns {Promise} Liste des groupes
   */
  getFriendGroups: async () => {
    try {
      const response = await api.get('/api/friends/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend groups:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau groupe d'amis
   * @param {Object} groupData - Données du groupe (name, members, color)
   * @returns {Promise} Groupe créé
   */
  createFriendGroup: async (groupData) => {
    try {
      const response = await api.post('/api/friends/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating friend group:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un groupe d'amis
   * @param {string} groupId - ID du groupe
   * @param {Object} groupData - Nouvelles données du groupe
   * @returns {Promise} Groupe mis à jour
   */
  updateFriendGroup: async (groupId, groupData) => {
    try {
      const response = await api.put(`/api/friends/groups/${groupId}`, groupData);
      return response.data;
    } catch (error) {
      console.error('Error updating friend group:', error);
      throw error;
    }
  },

  /**
   * Supprimer un groupe d'amis
   * @param {string} groupId - ID du groupe
   * @returns {Promise} Résultat de l'opération
   */
  deleteFriendGroup: async (groupId) => {
    try {
      const response = await api.delete(`/api/friends/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting friend group:', error);
      throw error;
    }
  },

  /**
   * Ajouter des membres à un groupe
   * @param {string} groupId - ID du groupe
   * @param {Array} memberIds - IDs des membres à ajouter
   * @returns {Promise} Groupe mis à jour
   */
  addMembersToGroup: async (groupId, memberIds) => {
    try {
      const response = await api.post(`/api/friends/groups/${groupId}/members`, { memberIds });
      return response.data;
    } catch (error) {
      console.error('Error adding members to group:', error);
      throw error;
    }
  },

  /**
   * Retirer des membres d'un groupe
   * @param {string} groupId - ID du groupe
   * @param {Array} memberIds - IDs des membres à retirer
   * @returns {Promise} Groupe mis à jour
   */
  removeMembersFromGroup: async (groupId, memberIds) => {
    try {
      const response = await api.delete(`/api/friends/groups/${groupId}/members`, { 
        data: { memberIds } 
      });
      return response.data;
    } catch (error) {
      console.error('Error removing members from group:', error);
      throw error;
    }
  },

  // ===== Gestion des messages =====

  /**
   * Récupérer les conversations de l'utilisateur
   * @returns {Promise} Liste des conversations
   */
  getConversations: async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'une conversation
   * @param {string} friendId - ID de l'ami
   * @param {number} page - Numéro de page (pagination)
   * @param {number} limit - Nombre de messages par page
   * @returns {Promise} Liste des messages
   */
  getMessages: async (friendId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/messages/${friendId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message
   * @param {string} receiverId - ID du destinataire
   * @param {string} content - Contenu du message
   * @param {string} type - Type de message (text, image, music, video)
   * @returns {Promise} Message envoyé
   */
  sendMessage: async (receiverId, content, type = 'text') => {
    try {
      const response = await api.post('/api/messages', { 
        receiverId, 
        content, 
        type 
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Marquer un message comme lu
   * @param {string} messageId - ID du message
   * @returns {Promise} Résultat de l'opération
   */
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/api/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Supprimer un message
   * @param {string} messageId - ID du message
   * @returns {Promise} Résultat de l'opération
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/api/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  /**
   * Récupérer le nombre de messages non lus
   * @returns {Promise} Nombre de messages non lus
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messages/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // ===== Statistiques =====

  /**
   * Récupérer les statistiques d'amitié
   * @returns {Promise} Statistiques
   */
  getFriendshipStats: async () => {
    try {
      const response = await api.get('/api/friends/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching friendship stats:', error);
      throw error;
    }
  }
};

export default friendsService;