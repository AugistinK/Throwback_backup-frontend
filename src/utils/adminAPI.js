// components/utils/commentAPI.js
import api from './api';


const adminAPI = {
  // Récupérer les commentaires avec filtres
  getComments: async (filters = {}) => {
    try {
      const response = await api.get('/api/admin/comments', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },
  
  // Récupérer les statistiques des commentaires
  getCommentsStats: async () => {
    try {
      const response = await api.get('/api/admin/comments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching comments stats:', error);
      throw error;
    }
  },
  
  // Modérer un commentaire
  moderateComment: async (commentId, action, reason = '') => {
    try {
      const response = await api.put(`/api/admin/comments/${commentId}/moderate`, {
        action,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },
  
  // Modération en lot
  bulkModerateComments: async (commentIds, action, reason = '') => {
    try {
      const response = await api.put('/api/admin/comments/bulk-moderate', {
        commentIds,
        action,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk moderating comments:', error);
      throw error;
    }
  },
  
  // Répondre à un commentaire
  replyToComment: async (commentId, content) => {
    try {
      const response = await api.post(`/api/admin/comments/${commentId}/reply`, {
        contenu: content
      });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }
};

export { adminAPI };