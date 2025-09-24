// utils/adminAPI.js
import api from './api';
import axios from './axiosInstance';

export const adminAPI = {
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


  getLikes: async ({ params }) => {
    const res = await axios.get('/api/admin/likes', { params });
    return res.data;
  },
  getLikesStats: async () => {
    const res = await axios.get('/api/admin/likes/stats');
    return res.data;
  },
  getLikeDetails: async (id) => {
    const res = await axios.get(`/api/admin/likes/${id}`);
    return res.data;
  },
  deleteLike: async (id) => {
    const res = await axios.delete(`/api/admin/likes/${id}`);
    return res.data;
  },
  bulkDeleteLikes: async ({ likeIds }) => {
    const res = await axios.delete('/api/admin/likes/bulk', { data: { likeIds } });
    return res.data;
  },



};