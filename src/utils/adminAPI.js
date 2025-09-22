// utils/adminAPI.js
import api from './api';

export const adminAPI = {
  // Liste des commentaires
  getComments: async (params = {}) => {
    try {
      const response = await api.get('/api/admin/comments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin comments:', error);
      throw error;
    }
  },

  // Statistiques des commentaires
  getCommentsStats: async () => {
    try {
      const response = await api.get('/api/admin/comments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin comments stats:', error);
      throw error;
    }
  },

  // Modérer un commentaire
  moderateComment: async (commentId, action, reason = '') => {
    try {
      const response = await api.put(`/api/admin/comments/${commentId}/moderate`, { action, reason });
      return response.data;
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },

  // Modération en lot
  bulkModerateComments: async (commentIds, action, reason = '') => {
    try {
      const response = await api.put(`/api/admin/comments/bulk-moderate`, { commentIds, action, reason });
      return response.data;
    } catch (error) {
      console.error('Error bulk moderating comments:', error);
      throw error;
    }
  },

  // Répondre à un commentaire
  replyToComment: async (commentId, contenu) => {
    try {
      const response = await api.post(`/api/admin/comments/${commentId}/reply`, { contenu });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  },

  getLikes: async (filters = {}) => {
    const res = await api.get('/api/admin/likes', { params: filters });
    return res.data;
  },
  getLikesStats: async () => {
    const res = await api.get('/api/admin/likes/stats');
    return res.data;
  },
  getLikeDetails: async (id) => {
    const res = await api.get(`/api/admin/likes/${id}`);
    return res.data;
  },
  deleteLike: async (id) => {
    const res = await api.delete(`/api/admin/likes/${id}`);
    return res.data;
  },
  bulkDeleteLikes: async (payload) => {
    const res = await api.delete('/api/admin/likes/bulk', { data: payload });
    return res.data;
  }

};

export default adminAPI;