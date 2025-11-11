// src/utils/friendsAPI.js - VERSION COMPLÈTE FINALE POUR THROWBACK
import api from './api';

/**
 * 🎯 API COMPLÈTE pour les fonctionnalités sociales de ThrowBack
 * 
 * Inclut:
 * - Gestion des amis (ajout, acceptation, rejet, suppression)
 * - Demandes d'amis (envoi, réception, suggestions)
 * - Groupes d'amis (création, gestion)
 * - Messagerie (conversations, messages, notifications)
 * - Blocage d'utilisateurs
 * - Statistiques sociales
 * 
 * @version 2.0.0
 * @date Janvier 2025
 */

const friendsAPI = {
  // ============================================
  // GESTION DES AMIS
  // ============================================

  /**
   * Récupérer tous les amis de l'utilisateur connecté
   * @returns {Promise<Object>} Liste des amis
   */
  getFriends: async () => {
    try {
      const response = await api.get('/api/friends');
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load friends',
        data: []
      };
    }
  },

  /**
   * Récupérer les demandes d'amis en attente
   * @returns {Promise<Object>} Liste des demandes reçues
   */
  getFriendRequests: async () => {
    try {
      const response = await api.get('/api/friends/requests');

      // Vérification du format de réponse
      if (response.data.success && Array.isArray(response.data.data)) {
        // Log pour debug (à retirer en production)
        if (response.data.data.length > 0) {
          const firstRequest = response.data.data[0];
          console.log('✅ Friend request format check:', {
            has_id: !!firstRequest._id,
            has_friendshipId: !!firstRequest.friendshipId,
            has_senderId: !!firstRequest.senderId,
            ids_different: firstRequest._id !== firstRequest.senderId
          });
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load friend requests',
        data: []
      };
    }
  },

  /**
   * Récupérer les suggestions d'amis
   * @returns {Promise<Object>} Liste des suggestions
   */
  getFriendSuggestions: async () => {
    try {
      const response = await api.get('/api/friends/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load suggestions',
        data: []
      };
    }
  },

  /**
   * Envoyer une demande d'ami
   * @param {string} friendId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  sendFriendRequest: async (friendId) => {
    try {
      if (!friendId) {
        throw new Error('Friend ID is required');
      }

      const response = await api.post('/api/friends/request', { friendId });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send friend request'
      };
    }
  },

  /**
   * ✅ Accepter une demande d'ami
   * 
   * IMPORTANT: friendshipId DOIT être l'ID du document Friendship (_id),
   * PAS l'ID de l'utilisateur (senderId)
   * 
   * @param {string} friendshipId - ID du document Friendship
   * @returns {Promise<Object>} Résultat de l'acceptation
   */
  acceptFriendRequest: async (friendshipId) => {
    try {
      // Validation
      if (!friendshipId || typeof friendshipId !== 'string') {
        throw new Error('Invalid friendship ID');
      }

      console.log('✅ Accepting friend request with ID:', friendshipId);

      // Route correcte : PUT /api/friends/accept/:friendshipId
      const response = await api.put(`/api/friends/accept/${friendshipId}`);

      console.log('✅ Friend request accepted successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error accepting friend request:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept friend request',
        error: error.message
      };
    }
  },

  /**
   * ❌ Refuser une demande d'ami
   * @param {string} friendshipId - ID du document Friendship
   * @returns {Promise<Object>} Résultat du refus
   */
  rejectFriendRequest: async (friendshipId) => {
    try {
      // Validation
      if (!friendshipId || typeof friendshipId !== 'string') {
        throw new Error('Invalid friendship ID');
      }

      console.log('❌ Rejecting friend request with ID:', friendshipId);

      // Route correcte : DELETE /api/friends/reject/:friendshipId
      const response = await api.delete(`/api/friends/reject/${friendshipId}`);

      console.log('✅ Friend request rejected successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error rejecting friend request:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject friend request',
        error: error.message
      };
    }
  },

  /**
   * Retirer un ami
   * @param {string} friendId - ID de l'ami à retirer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  removeFriend: async (friendId) => {
    try {
      if (!friendId) {
        throw new Error('Friend ID is required');
      }

      const response = await api.delete(`/api/friends/remove/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing friend:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove friend'
      };
    }
  },

  /**
   * Bloquer un utilisateur
   * @param {string} userId - ID de l'utilisateur à bloquer
   * @returns {Promise<Object>} Résultat du blocage
   */
  blockUser: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await api.post('/api/friends/block', { userId });
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to block user'
      };
    }
  },

  /**
   * Débloquer un utilisateur
   * @param {string} userId - ID de l'utilisateur à débloquer
   * @returns {Promise<Object>} Résultat du déblocage
   */
  unblockUser: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await api.delete(`/api/friends/unblock/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unblock user'
      };
    }
  },

  /**
   * Récupérer les utilisateurs bloqués
   * @returns {Promise<Object>} Liste des utilisateurs bloqués
   */
  getBlockedUsers: async () => {
    try {
      const response = await api.get('/api/friends/blocked');
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load blocked users',
        data: []
      };
    }
  },

  /**
   * Rechercher des utilisateurs
   * @param {string} query - Terme de recherche
   * @returns {Promise<Object>} Résultats de recherche
   */
  searchUsers: async (query) => {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          message: 'Search query must be at least 2 characters',
          data: []
        };
      }

      const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Search failed',
        data: []
      };
    }
  },

  /**
   * Récupérer les amis mutuels avec un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Liste des amis mutuels
   */
  getMutualFriends: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await api.get(`/api/friends/mutual/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load mutual friends',
        data: []
      };
    }
  },

  // ============================================
  // GESTION DES GROUPES D'AMIS
  // ============================================

  /**
   * Récupérer tous les groupes d'amis
   * @returns {Promise<Object>} Liste des groupes
   */
  getFriendGroups: async () => {
    try {
      const response = await api.get('/api/friends/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend groups:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load friend groups',
        data: []
      };
    }
  },

  /**
   * Créer un nouveau groupe d'amis
   * @param {Object} groupData - Données du groupe
   * @returns {Promise<Object>} Groupe créé
   */
  createFriendGroup: async (groupData) => {
    try {
      const response = await api.post('/api/friends/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating friend group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create friend group'
      };
    }
  },

  /**
   * Mettre à jour un groupe d'amis
   * @param {string} groupId - ID du groupe
   * @param {Object} groupData - Nouvelles données
   * @returns {Promise<Object>} Groupe mis à jour
   */
  updateFriendGroup: async (groupId, groupData) => {
    try {
      const response = await api.put(`/api/friends/groups/${groupId}`, groupData);
      return response.data;
    } catch (error) {
      console.error('Error updating friend group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update friend group'
      };
    }
  },

  /**
   * Supprimer un groupe d'amis
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Object>} Résultat de la suppression
   */
  deleteFriendGroup: async (groupId) => {
    try {
      const response = await api.delete(`/api/friends/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting friend group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete friend group'
      };
    }
  },

  /**
   * Ajouter des membres à un groupe
   * @param {string} groupId - ID du groupe
   * @param {Array<string>} memberIds - IDs des membres
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  addMembersToGroup: async (groupId, memberIds) => {
    try {
      const response = await api.post(`/api/friends/groups/${groupId}/members`, { memberIds });
      return response.data;
    } catch (error) {
      console.error('Error adding members to group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add members to group'
      };
    }
  },

  /**
   * Retirer des membres d'un groupe
   * @param {string} groupId - ID du groupe
   * @param {Array<string>} memberIds - IDs des membres
   * @returns {Promise<Object>} Résultat du retrait
   */
  removeMembersFromGroup: async (groupId, memberIds) => {
    try {
      const response = await api.delete(`/api/friends/groups/${groupId}/members`, {
        data: { memberIds }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing members from group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove members from group'
      };
    }
  },

  // ============================================
  // GESTION DES MESSAGES (CHAT)
  // ============================================

  /**
   * Récupérer les conversations de l'utilisateur
   * @returns {Promise<Object>} Liste des conversations
   */
  getConversations: async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load conversations',
        data: []
      };
    }
  },

  /**
   * Récupérer les messages d'une conversation
   * @param {string} friendId - ID de l'ami
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre de messages par page
   * @returns {Promise<Object>} Messages paginés
   */
  getMessages: async (friendId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/api/messages/${friendId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);

      // Gestion spéciale pour 403 (pas amis)
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'You must be friends to message this user',
          errorType: 'NOT_FRIENDS',
          data: { messages: [] }
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load messages',
        data: { messages: [] }
      };
    }
  },

  /**
   * Envoyer un message
   * @param {string} receiverId - ID du destinataire
   * @param {string} content - Contenu du message
   * @param {string} type - Type de message (text, image, video, audio)
   * @returns {Promise<Object>} Message envoyé
   */
  sendMessage: async (receiverId, content, type = 'text') => {
    try {
      if (!receiverId || !content) {
        throw new Error('Receiver ID and content are required');
      }

      const response = await api.post('/api/messages', {
        receiverId,
        content,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  },

  /**
   * Marquer un message comme lu
   * @param {string} messageId - ID du message
   * @returns {Promise<Object>} Message mis à jour
   */
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/api/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark message as read'
      };
    }
  },

  /**
   * Supprimer un message
   * @param {string} messageId - ID du message
   * @returns {Promise<Object>} Résultat de la suppression
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/api/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete message'
      };
    }
  },

  /**
   * Récupérer le nombre de messages non lus
   * @returns {Promise<Object>} Nombre de messages non lus
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messages/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get unread count',
        data: { count: 0 }
      };
    }
  },

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupérer les statistiques d'amitié
   * @returns {Promise<Object>} Statistiques
   */
  getFriendshipStats: async () => {
    try {
      const response = await api.get('/api/friends/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching friendship stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load friendship statistics',
        data: {
          friends: 0,
          pendingRequests: 0,
          sentRequests: 0
        }
      };
    }
  },

  // ============================================
  // UTILITAIRES DE DIAGNOSTIC
  // ============================================

  /**
   * Tester la connexion aux routes d'amis
   * Utilisez cette méthode pour diagnostiquer les problèmes de connexion
   * @returns {Promise<Object>} Résultats des tests
   */
  testFriendRoutes: async () => {
    console.log('🔍 Testing friend routes...');
    const results = {};

    // Tester les routes GET
    const getRoutes = [
      '/api/friends',
      '/api/friends/requests',
      '/api/friends/suggestions',
      '/api/friends/stats',
      '/api/friends/groups',
      '/api/messages/conversations',
      '/api/messages/unread/count'
    ];

    for (const route of getRoutes) {
      try {
        const response = await api.get(route);
        results[route] = {
          status: 'SUCCESS',
          statusCode: response.status
        };
      } catch (error) {
        results[route] = {
          status: 'ERROR',
          statusCode: error.response?.status,
          message: error.message
        };
      }
    }

    console.log('✅ Route test results:', results);
    return results;
  }
};

export default friendsAPI;