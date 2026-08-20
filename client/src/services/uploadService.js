import api from './api';

export const uploadService = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },
};
