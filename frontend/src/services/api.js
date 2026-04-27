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
export const saveSession = (data) => API.post('/ai/save-session', data);
export const getSessionHistory = () => API.get('/ai/session-history');

// Admin - Topics & Questions
export const addNewTopic = (data) => API.post('/speaking/add-topic', data);
export const addNewQuestion = (data) => API.post('/speaking/add-question', data);
export const deleteTopic = (topicId) => API.delete(`/speaking/topic/${topicId}`);
export const deleteQuestion = (questionId) => API.delete(`/speaking/question/${questionId}`);

// Admin - Users
export const getAllUsers = () => API.get('/users');
export const updateUserRole = (userId, role) => API.put(`/users/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/users/${userId}`);

// Mock exam
export const startMockExam = () => API.post('/mock-exam/start');
export const submitMockPart = (data) => API.post('/mock-exam/submit-part', data);
export const getMockExamHistory = () => API.get('/mock-exam/history');

// Progress & bashorat
export const getProgress = () => API.get('/ai/progress');

// Payment
export const getPaymentStatus = () => API.get('/payment/status');
// Leaderboard & Limits
export const getLeaderboard = (type) => API.get(`/leaderboard/${type}`);
export const getMyLimits = () => API.get('/leaderboard/me/limits');

export const verifyEmail = (data) => API.post('/auth/verify-email', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

export default API;