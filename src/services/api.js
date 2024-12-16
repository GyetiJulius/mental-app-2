import { Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://192.168.0.128:3000/api';
  } else {
    return 'http://192.168.0.128:3000/api';
  }
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    console.log('Token for request:', token); // Debug log
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
});

// Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data) {
    try {
      console.log('Making login request with:', { email: data.email });
      const response = await api.post('/auth/login', data);
      console.log('Login response data:', response.data);
      
      if (response.data && response.data.token) {
        // Store token immediately after receiving it
        await SecureStore.setItemAsync('token', response.data.token);
        console.log('Token stored successfully');
        
        // Verify token was stored
        const storedToken = await SecureStore.getItemAsync('token');
        console.log('Verified stored token:', storedToken);
      } else {
        console.error('No token in response:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Chat Service
export const chatService = {
  async getConversations() {
    const response = await api.get('/chat');
    return response.data;
  },

  async createConversation(data) {
    const response = await api.post('/chat', {
      title: data.title,
      question: data.question
    });
    return response.data;
  },

  async sendMessage(conversationId, content) {
    try {
      console.log('Sending message:', { conversationId, content });
      const response = await api.post(`/chat/${conversationId}/message`, {
        content
      });
      
      console.log('Message response:', response.data);
      return response.data.messages; // Return array containing both messages
    } catch (error) {
      console.error('Message send error:', error.response?.data || error);
      throw error;
    }
  }
};

export default api;

