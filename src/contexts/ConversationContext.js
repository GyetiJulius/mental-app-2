import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Alert } from 'react-native';

// Create and export the context
export const ConversationContext = createContext(null);

// Export the hook
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

// Export the provider
export const ConversationProvider = ({ children }) => {
  console.log('ConversationProvider rendering with children:', !!children);
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  console.log('Auth status:', { token, isAuthenticated }); // Debug log

  useEffect(() => {
    const setupApi = async () => {
      if (token && isAuthenticated) {
        try {
          await loadConversations();
        } catch (error) {
          console.error('Failed to load initial conversations:', error);
        }
      }
    };

    setupApi();
  }, [token, isAuthenticated]);

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor to update token if it changes
  api.interceptors.request.use((config) => {
    // Update token on each request
    config.headers.Authorization = token ? `Bearer ${token}` : '';
    return config;
  });

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chat');
      console.log('Loaded conversations:', response.data);
      setConversations(response.data);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (title) => {
    try {
      setIsLoading(true);
      
      const conversationData = {
        title: title || 'New Chat',
        question: 'How can I help you today?'
      };

      console.log('Creating conversation with data:', conversationData);

      const response = await api.post('/chat', conversationData);

      console.log('Server response:', response.data);
      const newConversation = response.data;
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversation(newConversation);
      return newConversation;
    } catch (error) {
      console.error('Create conversation error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.data?.error) {
        Alert.alert('Error', error.response.data.error);
      } else {
        Alert.alert('Error', 'Failed to create conversation');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (conversationId, content) => {
    try {
      if (!conversationId) {
        console.error('No conversation ID provided');
        throw new Error('No conversation selected');
      }

      console.log('Sending message:', { conversationId, content });

      const response = await api.post(`/chat/${conversationId}/message`, {
        content
      });

      console.log('Server response:', response.data);

      // Check if we have messages in the response
      if (response.data.messages && Array.isArray(response.data.messages)) {
        const [userMessage, assistantMessage] = response.data.messages;

        // Format messages to match our frontend structure
        const formattedMessages = [
          {
            _id: userMessage._id || Math.random().toString(),
            content: userMessage.content,
            sender: 'user',
            timestamp: userMessage.timestamp
          },
          {
            _id: assistantMessage._id || Math.random().toString(),
            content: assistantMessage.content,
            sender: 'assistant',
            timestamp: assistantMessage.timestamp
          }
        ];

        console.log('Formatted messages:', formattedMessages);

        // Update current conversation
        setCurrentConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), ...formattedMessages]
          };
        });

        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversationId 
              ? {
                  ...conv,
                  messages: [...(conv.messages || []), ...formattedMessages]
                }
              : conv
          )
        );
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      return response.data;
    } catch (error) {
      console.error('Send message error:', error.response?.data || error);
      throw error;
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      console.log('Attempting to delete conversation:', conversationId);
      
      const response = await api.delete(`/chat/${conversationId}`);
      console.log('Delete response:', response.data);

      if (response.data.message === "Conversation deleted successfully") {
        // Update local state only after successful deletion
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // Clear current conversation if it was the one deleted
        if (currentConversation?._id === conversationId) {
          setCurrentConversation(null);
        }

        return response.data;
      }
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        // Handle not found error
        Alert.alert('Error', 'Conversation not found');
      } else {
        // Handle other errors
        Alert.alert('Error', 'Failed to delete conversation');
      }
      throw error;
    }
  };

  // Add confirmation dialog
  const confirmAndDeleteConversation = (conversationId) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
            } catch (error) {
              // Error is already handled in deleteConversation
              console.error('Confirmation delete error:', error);
            }
          }
        }
      ]
    );
  };

  // Debug log for state changes
  useEffect(() => {
    console.log('Current conversations:', conversations);
    console.log('Current conversation:', currentConversation);
  }, [conversations, currentConversation]);

  const value = {
    conversations,
    currentConversation,
    isLoading,
    setCurrentConversation,
    loadConversations,
    createNewConversation,
    sendMessage,
    deleteConversation: confirmAndDeleteConversation
  };

  console.log('Provider value:', value);

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}; 