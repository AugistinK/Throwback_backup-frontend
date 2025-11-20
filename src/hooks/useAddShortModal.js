// hooks/useAddShortModal.js
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

export const useAddShortModal = (fetchShorts, showFeedback) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', artiste: '', description: '', video: null, duree: 0 });
  const [errDuree, setErrDuree] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const videoRef = useRef();

  const handleChange = useCallback((e) => {
    e.stopPropagation();
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileSelected = useCallback((file) => {
    setErrDuree('');

    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrDuree('The selected file is not a video.');
      setForm(f => ({ ...f, video: null }));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrDuree('The file is too large (max 100MB).');
      setForm(f => ({ ...f, video: null }));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(url);
      const duration = video.duration;

      if (duration < 10 || duration > 30) {
        setErrDuree('The video must be between 10 and 30 seconds long.');
        setForm(f => ({ ...f, video: null }));
      } else {
        setErrDuree('');
        setForm(f => ({ ...f, video: file, duree: Math.round(duration) }));
      }
    };

    video.onerror = () => {
      setErrDuree('Unable to read this video file.');
      setForm(f => ({ ...f, video: null }));
    };

    video.src = url;
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFileSelected(file);
  }, [handleFileSelected]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  }, [handleFileSelected]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.titre.trim()) {
      showFeedback('Title is required', 'error');
      return;
    }

    if (!form.artiste.trim()) {
      showFeedback('Artist is required', 'error');
      return;
    }

    if (!form.video) {
      setErrDuree('Please select a valid video.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setErrDuree('');

      const data = new FormData();
      data.append('titre', form.titre);
      data.append('artiste', form.artiste);
      data.append('duree', form.duree || 15);
      data.append('videoFile', form.video);

      if (form.description) {
        data.append('description', form.description);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('You must be logged in to add a short', 'error');
        setIsUploading(false);
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'api.throwback-connect.com';

      await axios.post(`${apiBaseUrl}/api/videos/shorts`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000,
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      showFeedback('Short added successfully!', 'success');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null, description: '', duree: 0 });
      setErrDuree('');
      setUploadProgress(0);

      setTimeout(() => {
        fetchShorts();
      }, 1000);

    } catch (err) {
      console.error('Error adding short:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error during upload';
      setErrDuree(errorMessage);
      showFeedback(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    showModal,
    setShowModal,
    form,
    errDuree,
    isUploading,
    uploadProgress,
    dragActive,
    videoRef,
    handleChange,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit
  };
};