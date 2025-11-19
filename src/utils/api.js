// src/utils/api.js - VERSION CORRIGÉE POUR INTÉGRATION COMPLÈTE
import axios from 'axios';
import podcastAPI from './podcastAPI';
import playlistAPI from './playlistAPI';
import searchAPI from './searchAPI';
import socialAPI from './socialAPI';
import { adminAPI } from './adminAPI';
import friendsAPI from './friendsAPI'; 

//  Configuration de base (espace en trop supprimé à la fin de l'URL)
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

// ============================================
// INTERCEPTEURS
// ============================================

// Intercepteur de requête pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Logging sélectif pour debug
    if (
      config.url.includes('/videos/') || 
      config.url.includes('/memories') || 
      config.url.includes('/like') || 
      config.url.includes('/profile') ||
      config.url.includes('/friends') 
    ) {
      console.log(` API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data && typeof config.data !== 'object') {
        console.log(' Request data:', config.data);
      }
    }
    return config;
  },
  (error) => {
    console.error(' Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    // Logging sélectif pour debug
    if (
      response.config.url.includes('/videos/') || 
      response.config.url.includes('/memories') || 
      response.config.url.includes('/like') || 
      response.config.url.includes('/profile') ||
      response.config.url.includes('/friends') 
    ) {
      console.log(` API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log(' Response data:', response.data);
    }
    return response;
  },
  (error) => {
    //  Meilleure gestion des erreurs
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error(' API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: error.response.data
      });
      
      //  Gestion spéciale pour 401 (non authentifié)
      if (error.response.status === 401) {
        console.warn(' Unauthorized - Token may be invalid');
        // Optionnel : rediriger vers login
        // window.location.href = '/login';
      }
      
      //  Gestion spéciale pour 403 (interdit)
      if (error.response.status === 403) {
        console.warn(' Forbidden - Insufficient permissions');
      }
      
      //  Gestion spéciale pour 404 (non trouvé)
      if (error.response.status === 404) {
        console.warn(' Not Found:', error.config?.url);
      }
      
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      console.error(' No response received:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error(' Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// VIDEO API
// ============================================

const videoAPI = {
  // Récupérer toutes les vidéos publiques
  getAllVideos: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        type: 'music',
        limit: '50',
        ...params
      }).toString();
      const response = await api.get(`/api/public/videos?${queryParams}`);
      if (response.data.success) return response.data.data || response.data.videos || [];
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      try {
        const fallbackResponse = await api.get('/api/videos?type=music&limit=50');
        if (fallbackResponse.data.success) return fallbackResponse.data.data || [];
      } catch {}
      return [];
    }
  },

  // Détail vidéo
  getVideoById: async (videoId) => {
    try {
      const response = await api.get(`/api/public/videos/${videoId}`);
      if (response.data.success) return response.data.data || response.data;
      throw new Error(response.data.message || 'Vidéo non trouvée');
    } catch (error) {
      try {
        const fallbackResponse = await api.get(`/api/videos/${videoId}`);
        if (fallbackResponse.data.success) return fallbackResponse.data.data || fallbackResponse.data;
      } catch {}
      throw error;
    }
  },

  // Souvenirs d'une vidéo (filtrage strict côté backend et re-filtrage côté front si besoin)
  getVideoMemories: async (videoId) => {
    try {
      // Route directe publique
      const r = await api.get(`/api/public/videos/${videoId}/memories`);
      if (r.data?.success && Array.isArray(r.data.data)) {
        const memories = r.data.data;
        // Cache léger: fusion dans allMemories
        try {
          const cacheJSON = localStorage.getItem('allMemories');
          const cache = cacheJSON ? JSON.parse(cacheJSON) : [];
          const ids = new Set(cache.map(m => m._id || m.id));
          const uniq = memories.filter(m => !ids.has(m._id || m.id));
          if (uniq.length > 0) {
            localStorage.setItem('allMemories', JSON.stringify([...uniq, ...cache]));
            localStorage.setItem('memoriesFetchTime', Date.now().toString());
          }
        } catch {}
        return memories;
      }
    } catch {}

    // Fallback: route interne
    try {
      const fr = await api.get(`/api/videos/${videoId}/memories`);
      if (fr.data?.success && Array.isArray(fr.data.data)) return fr.data.data;
    } catch {}

    // Dernier recours : cache local filtré
    try {
      const cacheJSON = localStorage.getItem('allMemories');
      if (cacheJSON) {
        const cache = JSON.parse(cacheJSON);
        return cache.filter(m => {
          const vid =
            (m.video && typeof m.video === 'object' ? m.video._id : null) ||
            (typeof m.video === 'string' ? m.video : null) ||
            m.videoId || m.video_id;
          return vid && vid.toString() === videoId.toString();
        });
      }
    } catch {}

    return [];
  },

  // Ajouter un souvenir
  addMemory: async (videoId, content) => {
    const payload = {
      contenu: content,
      video_id: videoId,
      videoId: videoId,
      video: videoId
    };
    try {
      const r = await api.post(`/api/public/videos/${videoId}/memories`, payload);
      if (r.data?.success) {
        if (r.data.data && !r.data.data.video && !r.data.data.videoId && !r.data.data.video_id) {
          r.data.data.video = { _id: videoId };
          r.data.data.videoId = videoId;
        }
        return r.data;
      }
      throw new Error(r.data?.message || 'Erreur lors de ajout du souvenir');
    } catch (e) {
      const fr = await api.post(`/api/videos/${videoId}/memories`, payload);
      if (fr.data?.success) {
        if (fr.data.data && !fr.data.data.video && !fr.data.data.videoId && !fr.data.data.video_id) {
          fr.data.data.video = { _id: videoId };
          fr.data.data.videoId = videoId;
        }
        return fr.data;
      }
      throw e;
    }
  },

  // Récupérer tous les souvenirs (version "recent")
  getAllMemories: async () => {
    try {
      const r = await api.get('/api/public/memories/recent?limit=200');
      if (r.data && Array.isArray(r.data.data)) return r.data.data;
    } catch {}
    try {
      const fr = await api.get('/api/memories'); // fallback interne
      if (fr.data && Array.isArray(fr.data.data)) return fr.data.data;
    } catch {}
    return [];
  },

  // Like/unlike un souvenir OU une réponse (même endpoint)
  likeMemory: async (memoryId) => {
    try {
      // Priorité à la route interne, qui est certaine d'exister
      const r = await api.post(`/api/memories/${memoryId}/like`);
      if (r.data?.success) return r.data;
      throw new Error(r.data?.message || 'Échec du like');
    } catch (e) {
      // Fallback public s'il existe côté serveur
      try {
        const pr = await api.post(`/api/public/memories/${memoryId}/like`);
        if (pr.data?.success) return pr.data;
      } catch {}
      throw e;
    }
  },

  // Like vidéo
  likeVideo: async (videoId) => {
    try {
      const r = await api.post(`/api/public/videos/${videoId}/like`);
      if (r.data?.success) return r.data;
      throw new Error(r.data?.message || 'Erreur lors du like');
    } catch (e) {
      const fr = await api.post(`/api/videos/${videoId}/like`);
      if (fr.data?.success) return fr.data;
      throw e;
    }
  },

  // Log partage
  shareVideo: async (videoId) => {
    try {
      const r = await api.post(`/api/public/videos/${videoId}/share`, {});
      return r.data;
    } catch {
      try {
        const fr = await api.post(`/api/videos/${videoId}/share`, {});
        return fr.data;
      } catch {
        return { success: true, message: 'Partage enregistré' };
      }
    }
  }
};

// ============================================
// CONVERSATIONS API (NOUVEAU)
// ============================================

const conversationsAPI = {
  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  getConversations: async () => {
    try {
      const response = await api.get('/api/conversations');
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
   * Récupérer ou créer une conversation directe
   */
  getOrCreateDirectConversation: async (friendId) => {
    try {
      const response = await api.post('/api/conversations/direct', { friendId });
      return response.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create conversation'
      };
    }
  },

  /**
   * Créer un groupe
   */
  createGroup: async (name, participants, description = '') => {
    try {
      const response = await api.post('/api/conversations/groups', {
        name,
        participants,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create group'
      };
    }
  },

  /**
   * Mettre à jour un groupe
   */
  updateGroup: async (groupId, data) => {
    try {
      const response = await api.put(`/api/conversations/groups/${groupId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update group'
      };
    }
  },

  /**
   * Ajouter un participant à un groupe
   */
  addParticipantToGroup: async (groupId, participantId) => {
    try {
      const response = await api.post(
        `/api/conversations/groups/${groupId}/participants`,
        { participantId }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding participant:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add participant'
      };
    }
  },

  /**
   * Retirer un participant d'un groupe
   */
  removeParticipantFromGroup: async (groupId, participantId) => {
    try {
      const response = await api.delete(
        `/api/conversations/groups/${groupId}/participants/${participantId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing participant:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove participant'
      };
    }
  },

  /**
   * Archiver une conversation
   */
  archiveConversation: async (conversationId) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to archive conversation'
      };
    }
  },

  /**
   * Désarchiver une conversation
   */
  unarchiveConversation: async (conversationId) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unarchive conversation'
      };
    }
  },

  /**
   * Épingler une conversation
   */
  pinConversation: async (conversationId) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error pinning conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to pin conversation'
      };
    }
  },

  /**
   * Désépingler une conversation
   */
  unpinConversation: async (conversationId) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/unpin`);
      return response.data;
    } catch (error) {
      console.error('Error unpinning conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unpin conversation'
      };
    }
  },

  /**
   * Désactiver les notifications pour une conversation
   */
  muteConversation: async (conversationId, duration = null) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/mute`, {
        duration
      });
      return response.data;
    } catch (error) {
      console.error('Error muting conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mute conversation'
      };
    }
  },

  /**
   * Réactiver les notifications pour une conversation
   */
  unmuteConversation: async (conversationId) => {
    try {
      const response = await api.put(`/api/conversations/${conversationId}/unmute`);
      return response.data;
    } catch (error) {
      console.error('Error unmuting conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unmute conversation'
      };
    }
  }
};

// ============================================
// NOTIFICATIONS API (NOUVEAU)
// ============================================

const notificationsAPI = {
  getUserNotifications: async () => {
    try {
      const res = await api.get('/api/notifications');
      // backend renvoie normalement { success, data, unreadCount }
      return res.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load notifications',
        data: [],
        unreadCount: 0
      };
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await api.post('/api/notifications/mark-all-read');
      return res.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark notifications as read'
      };
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await api.post(`/api/notifications/${id}/read`);
      return res.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark notification as read'
      };
    }
  }
};

// ============================================
// SUPPORT API (Contact / Help & Support)
// ============================================

const supportAPI = {
  /**
   * Envoyer un message au support
   * payload: { email, subject, message }
   */
  contactSupport: async ({ email, subject, message }) => {
    try {
      const res = await api.post('/api/support/contact', {
        email,
        subject,
        message,
      });
      // backend: { success: true/false, message: '...' }
      return res.data;
    } catch (error) {
      console.error('Error sending support message:', error);
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          'An error occurred while sending your message. Please try again.',
      };
    }
  },
};


// =================Admin FRIENDS CHAT API==========================

const adminFriendsChatAPI = {
  getOverview() {
    return api.get('/api/admin/friends-chat/overview');
  },

  getUserSummary(userId) {
    return api.get(`/api/admin/friends-chat/users/${userId}`);
  },

  getFriendships(params = {}) {
    return api.get('/api/admin/friends-chat/friendships', { params });
  },

  deleteFriendship(friendshipId) {
    return api.delete(`/api/admin/friends-chat/friendships/${friendshipId}`);
  },

  getBlocks() {
    return api.get('/api/admin/friends-chat/blocks');
  },

  getConversations(params = {}) {
    return api.get('/api/admin/friends-chat/conversations', { params });
  },

  getConversationMessages(conversationId, params = {}) {
    return api.get(
      `/api/admin/friends-chat/conversations/${conversationId}/messages`,
      { params }
    );
  },

  getDirectMessages(userA, userB, params = {}) {
    return api.get('/api/admin/friends-chat/direct-messages', {
      params: { userA, userB, ...params }
    });
  },

  adminDeleteMessage(messageId) {
    return api.delete(`/api/admin/friends-chat/messages/${messageId}`);
  },

  getReports(params = {}) {
    return api.get('/api/admin/friends-chat/reports', { params });
  },

  updateReport(reportId, payload) {
    return api.put(`/api/admin/friends-chat/reports/${reportId}`, payload);
  }
};


// ============================================
// EXPORTS
// ============================================

export { videoAPI };
export { podcastAPI };
export { playlistAPI };
export { searchAPI };
export { socialAPI };
export { adminAPI };
export { friendsAPI };
export { conversationsAPI };
export { notificationsAPI };
export { supportAPI };  
export { adminFriendsChatAPI };
// Export par défaut de l'instance axios
export default api;
