// components/utils/wallAPI.js
import api from './api';

const wallAPI = {
  getFeed: (params={}) => api.get('/api/wall/feed', { params }).then(r => r.data),
  createPost: (payload, files=[]) => {
    const fd = new FormData();
    if (payload.text) fd.append('text', payload.text);
    if (payload.visibility) fd.append('visibility', payload.visibility);
    files.forEach(f => fd.append('media', f));
    return api.post('/api/wall/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => r.data);
  },
  getById: (id) => api.get(`/api/wall/posts/${id}`).then(r => r.data),
  react: (id, type='like') => api.post(`/api/wall/posts/${id}/react`, { type }).then(r => r.data),
  comment: (id, text) => api.post(`/api/wall/posts/${id}/comments`, { text }).then(r => r.data),
};

export default wallAPI;
