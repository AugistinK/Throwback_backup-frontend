// hooks/useShortInteractions.js
import { useState, useCallback } from 'react';
import axios from 'axios';

export const useShortInteractions = (shorts, setShorts) => {
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });

  const showFeedback = useCallback((message, type = 'info') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  }, []);

  const handleLike = async (shortId) => {
    if (isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showFeedback('You must be logged in to like a short', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      const response = await axios.post(`${apiBaseUrl}/api/videos/${shortId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
        withCredentials: true
      });

      if (response.data?.data) {
        const updatedShorts = shorts.map(short => {
          if (short._id === shortId) {
            return {
              ...short,
              likes: response.data.data.likes || short.likes,
              userInteraction: {
                ...(short.userInteraction || {}),
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              }
            };
          }
          return short;
        });

        setShorts(updatedShorts);
        showFeedback(
          response.data.data.liked ? 'You liked this short' : 'You no longer like this short',
          response.data.data.liked ? 'success' : 'info'
        );
      } else {
        const updatedShorts = shorts.map(short => {
          if (short._id === shortId) {
            const currentLikes = short.likes || 0;
            const isLiked = short.userInteraction?.liked;
            return {
              ...short,
              likes: isLiked ? currentLikes - 1 : currentLikes + 1,
              userInteraction: {
                ...(short.userInteraction || {}),
                liked: !isLiked,
                disliked: false
              }
            };
          }
          return short;
        });

        setShorts(updatedShorts);
        showFeedback('Action recorded', 'success');
      }
    } catch (err) {
      console.error('Error during like:', err);
      showFeedback('Error during like', 'error');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = async (shortId) => {
    if (isShareLoading) return;

    try {
      setIsShareLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showFeedback('You must be logged in to share a short', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      try {
        await axios.post(`${apiBaseUrl}/api/videos/${shortId}/share`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        });
      } catch (shareError) {
        console.warn('Share API error (ignored):', shareError);
      }

      const shareLink = `${window.location.origin}/shorts/${shortId}`;

      try {
        await navigator.clipboard.writeText(shareLink);
        showFeedback('Link copied to clipboard!', 'success');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        const textarea = document.createElement('textarea');
        textarea.value = shareLink;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showFeedback('Link copied to clipboard!', 'success');
          } else {
            throw new Error('Manual copy failed');
          }
        } catch (err) {
          showFeedback('Unable to copy link: ' + shareLink, 'info');
        }
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Error during share:', err);
      showFeedback('Error during share', 'error');
    } finally {
      setIsShareLoading(false);
    }
  };

  return {
    isLikeLoading,
    isShareLoading,
    feedback,
    showFeedback,
    handleLike,
    handleShare
  };
};