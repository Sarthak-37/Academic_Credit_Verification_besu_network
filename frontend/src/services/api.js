import axios from 'axios';

// Create an Axios instance pointing to our Node.js server
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Interceptor: Before any request is sent, attach the JWT token if we have one
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;