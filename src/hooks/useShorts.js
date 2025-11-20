// hooks/useShorts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useShorts = () => {
  const [shorts, setShorts] = useState([]);
  const [centerIdx, setCenterIdx] = useState(0);
  const [isLoadingShorts, setIsLoadingShorts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);
  const [activeShortId, setActiveShortId] = useState(null);

  const fetchShorts = async () => {
    try {
      setIsLoadingShorts(true);
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let finalError;
      let response;

      while (attempts < maxAttempts && !success) {
        try {
          attempts++;
          response = await axios.get(`${apiBaseUrl}/api/videos`, {
            params: { type: 'short', page: 1, limit: 12 },
            timeout: 10000 * attempts,
            withCredentials: true
          });
          success = true;
        } catch (err) {
          console.error(`Error attempt ${attempts}:`, err);
          finalError = err;
          if (attempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempts - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success) throw finalError || new Error("Failed after multiple attempts");

      let shortsData = [];
      if (response.data?.data) {
        shortsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        shortsData = response.data;
      } else if (response.data?.videos) {
        shortsData = Array.isArray(response.data.videos) ? response.data.videos : [];
      }

      shortsData = shortsData.map(short => ({
        ...short,
        youtubeUrl: getFullVideoUrl(short.youtubeUrl)
      }));

      setShorts(shortsData);
      if (shortsData.length > 0) {
        setActiveShortId(shortsData[0]._id);
      }
      setHasMoreShorts(shortsData.length >= 12);
    } catch (err) {
      console.error('Error loading shorts:', err);
      setShorts([]);
      setHasMoreShorts(false);
      throw err;
    } finally {
      setIsLoadingShorts(false);
    }
  };

  const loadMoreShorts = async () => {
    if (!hasMoreShorts || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      const response = await axios.get(`${apiBaseUrl}/api/videos`, {
        params: { type: 'short', page: nextPage, limit: 10 },
        timeout: 30000,
        withCredentials: true
      });

      let newShorts = [];
      if (response.data?.data) {
        newShorts = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        newShorts = response.data;
      } else if (response.data?.videos) {
        newShorts = Array.isArray(response.data.videos) ? response.data.videos : [];
      }

      newShorts = newShorts.map(short => ({
        ...short,
        youtubeUrl: getFullVideoUrl(short.youtubeUrl)
      }));

      if (newShorts.length === 0) {
        setHasMoreShorts(false);
      } else {
        setShorts([...shorts, ...newShorts]);
        setPage(nextPage);
        setHasMoreShorts(newShorts.length >= 10);
      }
    } catch (err) {
      console.error('Error loading more shorts:', err);
      throw err;
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleNavigate = useCallback((direction) => {
    if (shorts.length <= 1) return;

    const newIndex = direction === 'right'
      ? Math.min(centerIdx + 1, shorts.length - 1)
      : Math.max(centerIdx - 1, 0);

    if (newIndex !== centerIdx) {
      setCenterIdx(newIndex);
      if (shorts[newIndex]) {
        setActiveShortId(shorts[newIndex]._id);
      }
    }
  }, [shorts, centerIdx]);

  useEffect(() => {
    fetchShorts();
  }, []);

  return {
    shorts,
    centerIdx,
    setCenterIdx,
    isLoadingShorts,
    isLoadingMore,
    hasMoreShorts,
    activeShortId,
    setActiveShortId,
    fetchShorts,
    loadMoreShorts,
    handleNavigate
  };
};

// Helper function
function getFullVideoUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const backendUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';
  return `${backendUrl}${normalizedPath}`;
}