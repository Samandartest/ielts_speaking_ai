import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');

// Vocabulary
export const searchVocabulary = (topic) => API.post('/vocabulary/search', { topic });

// Speaking
export const getParts = () => API.get('/speaking/parts');
export const getTopics = (partId) => API.get(`/speaking/topics/${partId}`);
export const getQuestions = (topicId) => API.get(`/speaking/questions/${topicId}`);

// AI
export const getAIFeedback = (data) => API.post('/ai/feedback', data);

// Admin - Topics & Questions
export const addNewTopic = (data) => API.post('/speaking/add-topic', data);
export const addNewQuestion = (data) => API.post('/speaking/add-question', data);
export const deleteTopic = (topicId) => API.delete(`/speaking/topic/${topicId}`);
export const deleteQuestion = (questionId) => API.delete(`/speaking/question/${questionId}`);

// Admin - Users
export const getAllUsers = () => API.get('/users');
export const updateUserRole = (userId, role) => API.put(`/users/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/users/${userId}`);

export default API;