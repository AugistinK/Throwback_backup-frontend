// utils/socialAPI.js
import api from './api';

const socialAPI = {
  // Posts
  getAllPosts: async (params = {}) => {
    try {
      const response = await api.get('/api/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },
  
  getPostById: async (postId) => {
    try {
      const response = await api.get(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },
  
  createPost: async (formData) => {
    try {
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },
  
  updatePost: async (postId, data) => {
    try {
      const response = await api.put(`/api/posts/${postId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },
  
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
  
  likePost: async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },
  
  sharePost: async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },
  
  reportPost: async (postId, raison) => {
    try {
      const response = await api.post(`/api/posts/${postId}/report`, { raison });
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  },
  
  // Commentaires
  getPostComments: async (postId, params = {}) => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },
  
  addComment: async (postId, data) => {
    try {
      const response = await api.post(`/api/posts/${postId}/comments`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  getCommentReplies: async (commentId, params = {}) => {
    try {
      const response = await api.get(`/api/comments/${commentId}/replies`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      throw error;
    }
  },
  
  likeComment: async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },
  
  dislikeComment: async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Error disliking comment:', error);
      throw error;
    }
  },
  
  updateComment: async (commentId, data) => {
    try {
      const response = await api.put(`/api/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },
  
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

    getModerationStats: async () => {
    try {
      const response = await api.get('/api/admin/posts/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      throw error;
    }
  },

    restorePost: async (postId) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring post:', error);
      throw error;
    }
  },

    moderatePost: async (postId, raison) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/moderate`, {
        raison_moderation: raison
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating post:', error);
      throw error;
    }
  },

  
  reportComment: async (commentId, raison) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/report`, { raison });
      return response.data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }
};

export default socialAPI;