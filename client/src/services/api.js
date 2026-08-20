import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // sends the httpOnly JWT cookie on every request
});

// Centralized error normalization: every service can trust that a failed
// request throws an Error with a readable .message, instead of every
// call site having to dig into err.response.data.message itself.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
