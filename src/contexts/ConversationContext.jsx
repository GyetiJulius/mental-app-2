import React, { createContext, useState, useContext, useEffect } from 'react';
import { chatService } from '../services/api';

const ConversationContext = createContext(undefined);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data || []);
      if (data && data.length > 0) {
        setCurrentConversation(data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (title, question = title) => {
    try {
      setIsLoading(true);
      const conversation = await chatService.createConversation({
        title,
        question
      });
      
      setConversations(prev => [...prev, conversation]);
      setCurrentConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (conversationId, content) => {
    try {
      if (!conversationId) throw new Error('No conversation ID provided');
      
      setIsLoading(true);
      const messages = await chatService.sendMessage(conversationId, content);
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...(prev.messages || []), ...messages]
        };
      });

      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, messages: [...(conv.messages || []), ...messages] }
          : conv
      ));

      return messages;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <ConversationContext.Provider value={{
      conversations,
      currentConversation,
      setCurrentConversation,
      isLoading,
      createNewConversation,
      sendMessage,
      loadConversations
    }}>
      {children}
    </ConversationContext.Provider>
  );
};

export { ConversationProvider };

