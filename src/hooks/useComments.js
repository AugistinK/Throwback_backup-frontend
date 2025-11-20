// hooks/useComments.js
import { useState, useCallback } from 'react';
import axios from 'axios';

function getFullVideoUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const backendUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';
  return `${backendUrl}${normalizedPath}`;
}

export const useComments = (shorts, setShorts, showFeedback) => {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  const fetchComments = async (shortId) => {
    if (!shortId) return;

    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      const response = await axios.get(`${apiBaseUrl}/api/videos/${shortId}/memories`, {
        timeout: 15000,
        withCredentials: true
      });

      let commentsData = [];
      if (response.data?.data) {
        commentsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data?.memories) {
        commentsData = Array.isArray(response.data.memories) ? response.data.memories : [];
      }

      const normalizedComments = commentsData.map(comment => ({
        id: comment._id || comment.id || Math.random().toString(36).substr(2, 9),
        username: comment.auteur?.nom || comment.username || 'User',
        content: comment.contenu || comment.content || comment.texte || '',
        createdAt: comment.createdAt || comment.date || new Date().toISOString(),
        imageUrl: getFullVideoUrl(comment.auteur?.photo_profil) || comment.imageUrl || '/images/default-avatar.jpg'
      }));

      setComments(normalizedComments);
    } catch (err) {
      console.error('Error retrieving comments:', err);
      setComments([]);
    }
  };

  const addComment = async (activeShortId) => {
    if (!commentInput.trim() || !activeShortId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('You must be logged in to comment', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      await axios.post(`${apiBaseUrl}/api/videos/${activeShortId}/memories`,
        { contenu: commentInput },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        }
      );

      showFeedback('Comment added successfully', 'success');
      setCommentInput('');

      const updatedShorts = shorts.map(short => {
        if (short._id === activeShortId) {
          const currentCount = short.meta?.commentCount || 0;
          return {
            ...short,
            meta: {
              ...short.meta,
              commentCount: currentCount + 1
            }
          };
        }
        return short;
      });
      setShorts(updatedShorts);

      fetchComments(activeShortId);
    } catch (err) {
      console.error('Error adding comment:', err);
      showFeedback('Error adding comment', 'error');
    }
  };

  const toggleComments = useCallback(() => {
    setIsCommentsVisible(prev => !prev);
  }, []);

  return {
    comments,
    commentInput,
    setCommentInput,
    isCommentsVisible,
    setIsCommentsVisible,
    fetchComments,
    addComment,
    toggleComments
  };
};