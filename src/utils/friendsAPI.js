// src/utils/friendsAPI.js - VERSION COMPLÈTE FINALE POUR THROWBACK (fusionnée)
// Inclut toutes les méthodes de friendsAPI.js + friendsAPI_UPDATED.js
import api from './api';

/**
 * 🎯 API COMPLÈTE pour les fonctionnalités sociales de ThrowBack
 *
 * Couvert :
 * - Amis (listes, demandes, acceptation/rejet, suppression)
 * - Blocage / déblocage / utilisateurs bloqués
 * - Recherche & amis mutuels
 * - Groupes d’amis (CRUD + membres)
 * - Conversations & messages (directs et de groupe)
 * - Actions de chat (archiver, épingler, vider historique, reporter)
 * - Actions avancées sur messages (éditer, copier, transférer, répondre, suppression globale)
 * - Statistiques & utilitaires de diagnostic
 *
 * @version 2.1.0
 * @date Novembre 2025
 */

export const friendsAPI = {
  // ============================================
  // AMIS
  // ============================================

  /** Récupérer tous les amis */
  getFriends: async () => {
    try {
      const res = await api.get('/api/friends');
      return res.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load friends', data: [] };
    }
  },

  /** Demandes d’amis reçues */
  getFriendRequests: async () => {
    try {
      const res = await api.get('/api/friends/requests');
      return res.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load friend requests', data: [] };
    }
  },

  /** Suggestions d’amis */
  getFriendSuggestions: async () => {
    try {
      const res = await api.get('/api/friends/suggestions');
      return res.data;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load suggestions', data: [] };
    }
  },

  /** Envoyer une demande d’ami (corps { friendId }) */
  sendFriendRequest: async (friendId) => {
    try {
      if (!friendId) throw new Error('Friend ID is required');
      const res = await api.post('/api/friends/request', { friendId });
      return res.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to send friend request' };
    }
  },

  /** Accepter une demande (friendshipId = _id du document Friendship) */
  acceptFriendRequest: async (friendshipId) => {
    try {
      if (!friendshipId || typeof friendshipId !== 'string') throw new Error('Invalid friendship ID');
      const res = await api.put(`/api/friends/accept/${friendshipId}`);
      return res.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to accept friend request', error: error.message };
    }
  },

  /** Rejeter une demande (friendshipId) */
  rejectFriendRequest: async (friendshipId) => {
    try {
      if (!friendshipId || typeof friendshipId !== 'string') throw new Error('Invalid friendship ID');
      const res = await api.delete(`/api/friends/reject/${friendshipId}`);
      return res.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to reject friend request', error: error.message };
    }
  },

  /**
   * Retirer un ami
   * Par défaut : DELETE /api/friends/remove/:friendId
   * Fallback si 404: DELETE /api/chat/friend/:friendId (anciennes routes)
   */
  removeFriend: async (friendId) => {
    try {
      if (!friendId) throw new Error('Friend ID is required');
      const res = await api.delete(`/api/friends/remove/${friendId}`);
      return res.data;
    } catch (error) {
      // Fallback vers ancienne route si non trouvée
      if (error.response?.status === 404) {
        try {
          const res2 = await api.delete(`/api/chat/friend/${friendId}`);
          return res2.data;
        } catch (e2) {
          console.error('Error removing friend (fallback failed):', e2);
          return { success: false, message: e2.response?.data?.message || 'Failed to remove friend' };
        }
      }
      console.error('Error removing friend:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to remove friend' };
    }
  },

  // ============================================
  // BLOCAGE
  // ============================================

  blockUser: async (userId) => {
    try {
      if (!userId) throw new Error('User ID is required');
      const res = await api.post('/api/friends/block', { userId });
      return res.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to block user' };
    }
  },

  unblockUser: async (userId) => {
    try {
      if (!userId) throw new Error('User ID is required');
      const res = await api.delete(`/api/friends/unblock/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to unblock user' };
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await api.get('/api/friends/blocked');
      return res.data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load blocked users', data: [] };
    }
  },

  // ============================================
  // RECHERCHE & MUTUELS
  // ============================================

  searchUsers: async (query) => {
    try {
      if (!query || query.trim().length < 2) {
        return { success: false, message: 'Search query must be at least 2 characters', data: [] };
      }
      const res = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, message: error.response?.data?.message || 'Search failed', data: [] };
    }
  },

  getMutualFriends: async (userId) => {
    try {
      if (!userId) throw new Error('User ID is required');
      const res = await api.get(`/api/friends/mutual/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load mutual friends', data: [] };
    }
  },

  // ============================================
  // GROUPES D’AMIS
  // ============================================

  getFriendGroups: async () => {
    try {
      const res = await api.get('/api/friends/groups');
      return res.data;
    } catch (error) {
      console.error('Error fetching friend groups:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load friend groups', data: [] };
    }
  },

  /** groupData = { name, members, color, description } */
  createFriendGroup: async (groupData) => {
    try {
      const res = await api.post('/api/friends/groups', groupData);
      return res.data;
    } catch (error) {
      console.error('Error creating friend group:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to create friend group' };
    }
  },

  updateFriendGroup: async (groupId, groupData) => {
    try {
      const res = await api.put(`/api/friends/groups/${groupId}`, groupData);
      return res.data;
    } catch (error) {
      console.error('Error updating friend group:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update friend group' };
    }
  },

  deleteFriendGroup: async (groupId) => {
    try {
      const res = await api.delete(`/api/friends/groups/${groupId}`);
      return res.data;
    } catch (error) {
      console.error('Error deleting friend group:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to delete friend group' };
    }
  },

  addMembersToGroup: async (groupId, memberIds) => {
    try {
      const res = await api.post(`/api/friends/groups/${groupId}/members`, { memberIds });
      return res.data;
    } catch (error) {
      console.error('Error adding members to group:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to add members to group' };
    }
  },

  removeMembersFromGroup: async (groupId, memberIds) => {
    try {
      const res = await api.delete(`/api/friends/groups/${groupId}/members`, { data: { memberIds } });
      return res.data;
    } catch (error) {
      console.error('Error removing members from group:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to remove members from group' };
    }
  },

  // ============================================
  // CONVERSATIONS (DIRECTES & GROUPES)
  // ============================================

  /** Conversations list */
  getConversations: async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      return res.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load conversations', data: [] };
    }
  },

  /** Créer/récupérer une conversation directe avec un ami */
  getOrCreateDirectConversation: async (friendId) => {
    try {
      const res = await api.post('/api/conversations/direct', { friendId });
      return res.data;
    } catch (error) {
      console.error('Error getting/creating direct conversation:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to open conversation' };
    }
  },

  /** Créer un groupe de conversation (chat) */
  createGroup: async (name, participants, description = null) => {
    try {
      const res = await api.post('/api/conversations/groups', { name, participants, description });
      return res.data;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to create group' };
    }
  },

  updateGroup: async (groupId, data) => {
    try {
      const res = await api.put(`/api/conversations/groups/${groupId}`, data);
      return res.data;
    } catch (error) {
      console.error('Error updating group conversation:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update group' };
    }
  },

  addParticipantToGroup: async (groupId, participantId) => {
    try {
      const res = await api.post(`/api/conversations/groups/${groupId}/participants`, { participantId });
      return res.data;
    } catch (error) {
      console.error('Error adding participant:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to add participant' };
    }
  },

  removeParticipantFromGroup: async (groupId, participantId) => {
    try {
      const res = await api.delete(`/api/conversations/groups/${groupId}/participants/${participantId}`);
      return res.data;
    } catch (error) {
      console.error('Error removing participant:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to remove participant' };
    }
  },

  pinConversation: async (conversationId) => {
    try {
      const res = await api.put(`/api/conversations/${conversationId}/pin`);
      return res.data;
    } catch (error) {
      console.error('Error pinning conversation:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to pin conversation' };
    }
  },

  // ============================================
  // MESSAGES (DIRECTS)
  // ============================================

  /** Messages d’une conversation directe (friendId = interlocuteur) */
  getMessages: async (friendId, page = 1, limit = 50) => {
    try {
      const res = await api.get(`/api/messages/${friendId}`, { params: { page, limit } });
      return res.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        return { success: false, message: 'You must be friends to message this user', errorType: 'NOT_FRIENDS', data: { messages: [] } };
      }
      return { success: false, message: error.response?.data?.message || 'Failed to load messages', data: { messages: [] } };
    }
  },

  /** Envoyer un message direct */
  sendMessage: async (receiverId, content, type = 'text') => {
    try {
      if (!receiverId || !content) throw new Error('Receiver ID and content are required');
      const res = await api.post('/api/messages', { receiverId, content, type });
      return res.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to send message' };
    }
  },

  /** Marquer un message comme lu */
  markMessageAsRead: async (messageId) => {
    try {
      const res = await api.put(`/api/messages/${messageId}/read`);
      return res.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to mark message as read' };
    }
  },

  /** Supprimer un message (route messages simple) */
  deleteMessage: async (messageId) => {
    try {
      const res = await api.delete(`/api/messages/${messageId}`);
      return res.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to delete message' };
    }
  },

  /** Compteur de non lus */
  getUnreadCount: async () => {
    try {
      const res = await api.get('/api/messages/unread/count');
      return res.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to get unread count', data: { count: 0 } };
    }
  },

  // ============================================
  // ACTIONS AVANCÉES SUR MESSAGES (CHAT)
  // ============================================

  editMessage: async (messageId, content) => {
    try {
      const res = await api.put(`/api/chat/messages/${messageId}`, { content });
      return res.data;
    } catch (error) {
      console.error('Error editing message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to edit message' };
    }
  },

  copyMessage: async (messageId) => {
    try {
      const res = await api.post(`/api/chat/messages/${messageId}/copy`);
      return res.data;
    } catch (error) {
      console.error('Error copying message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to copy message' };
    }
  },

  /** Suppression avancée (deleteForEveryone) */
  deleteMessageAdvanced: async (messageId, deleteForEveryone = false) => {
    try {
      const res = await api.delete(`/api/chat/messages/${messageId}`, { data: { deleteForEveryone } });
      return res.data;
    } catch (error) {
      console.error('Error deleting message (advanced):', error);
      return { success: false, message: error.response?.data?.message || 'Failed to delete message' };
    }
  },

  forwardMessage: async (messageId, recipientIds) => {
    try {
      const res = await api.post(`/api/chat/messages/${messageId}/forward`, { recipientIds });
      return res.data;
    } catch (error) {
      console.error('Error forwarding message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to forward message' };
    }
  },

  replyToMessage: async (messageId, content) => {
    try {
      const res = await api.post(`/api/chat/messages/${messageId}/reply`, { content });
      return res.data;
    } catch (error) {
      console.error('Error replying to message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to reply to message' };
    }
  },

  // ============================================
  // ACTIONS DE CHAT (CONVERSATIONS)
  // ============================================

  archiveChat: async (conversationId) => {
    try {
      const res = await api.put(`/api/chat/${conversationId}/archive`);
      return res.data;
    } catch (error) {
      console.error('Error archiving chat:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to archive chat' };
    }
  },

  unarchiveChat: async (conversationId) => {
    try {
      const res = await api.put(`/api/chat/${conversationId}/unarchive`);
      return res.data;
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to unarchive chat' };
    }
  },

  clearChatHistory: async (friendId) => {
    try {
      const res = await api.delete(`/api/chat/${friendId}/history`);
      return res.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to clear chat history' };
    }
  },

  reportUser: async (reportedUserId, reason, description = '', messageId = null) => {
    try {
      const res = await api.post('/api/chat/report', { reportedUserId, reason, description, messageId });
      return res.data;
    } catch (error) {
      console.error('Error reporting user:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to report user' };
    }
  },

  // ============================================
  // MESSAGES DE GROUPE (CONVOS)
  // ============================================

  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    try {
      const res = await api.get(`/api/conversations/groups/${groupId}/messages`, { params: { page, limit } });
      return res.data;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to load group messages', data: { messages: [] } };
    }
  },

  sendGroupMessage: async (groupId, content, type = 'text') => {
    try {
      const res = await api.post(`/api/conversations/groups/${groupId}/messages`, { content, type });
      return res.data;
    } catch (error) {
      console.error('Error sending group message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to send group message' };
    }
  },

  // ============================================
  // STATS
  // ============================================

  getFriendshipStats: async () => {
    try {
      const res = await api.get('/api/friends/stats');
      return res.data;
    } catch (error) {
      console.error('Error fetching friendship stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load friendship statistics',
        data: { friends: 0, pendingRequests: 0, sentRequests: 0 }
      };
    }
  },

  // ============================================
  // DIAGNOSTIC
  // ============================================

  /** Ping de routes utiles pour débogage rapide */
  testFriendRoutes: async () => {
    const results = {};
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
        const r = await api.get(route);
        results[route] = { status: 'SUCCESS', statusCode: r.status };
      } catch (err) {
        results[route] = { status: 'ERROR', statusCode: err.response?.status, message: err.message };
      }
    }
    return results;
  }
};

export default friendsAPI;
