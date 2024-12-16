import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  Animated,
  Dimensions 
} from 'react-native';
import { format, isValid } from 'date-fns';
import { ConversationProvider, useConversation } from '../contexts/ConversationContext';
import ConversationDrawer from '../components/ConversationDrawer';

const DRAWER_WIDTH = 300;

// The main chat UI component
function ChatUI() {
  const [text, setText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const flatListRef = useRef(null);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const { 
    currentConversation, 
    sendMessage, 
    isLoading,
    conversations,
    setCurrentConversation,
    createNewConversation,
    deleteConversation,
    loadConversations
  } = useConversation();

  useEffect(() => {
    if (flatListRef.current && currentConversation?.messages?.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [currentConversation?.messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDeleteConversation = (conversationId) => {
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
          onPress: () => deleteConversation(conversationId)
        }
      ]
    );
  };

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    
    if (!currentConversation?._id) {
      Alert.alert('Error', 'Please select or create a conversation first');
      return;
    }

    try {
      console.log('Sending message in conversation:', currentConversation._id);
      await sendMessage(currentConversation._id, text.trim());
      setText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Send error:', error);
    }
  };

  const renderMessage = ({ item }) => {
    console.log('Rendering message item:', item);
    
    const messageTime = item.timestamp ? new Date(item.timestamp) : new Date();
    const formattedTime = isValid(messageTime) ? format(messageTime, 'HH:mm') : '';

    return (
      <View style={[
        styles.messageBubble,
        item.sender === 'assistant' ? styles.assistantMessage : styles.userMessage
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'assistant' ? styles.assistantMessageText : styles.userMessageText
        ]}>
          {item.content || 'No message content'}
        </Text>
        {formattedTime && (
          <Text style={[
            styles.timestamp,
            item.sender === 'assistant' ? styles.assistantTimestamp : styles.userTimestamp
          ]}>
            {formattedTime}
          </Text>
        )}
      </View>
    );
  };

  console.log('Current conversation state:', {
    id: currentConversation?._id,
    messageCount: currentConversation?.messages?.length,
    messages: currentConversation?.messages
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <ConversationDrawer
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={(conv) => {
            setCurrentConversation(conv);
            toggleDrawer();
          }}
          onClose={toggleDrawer}
          onNewConversation={() => {
            createNewConversation('New Chat');
            toggleDrawer();
          }}
          onDeleteConversation={handleDeleteConversation}
        />
      </Animated.View>

      <View style={styles.main}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currentConversation?.title || 'New Chat'}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={currentConversation?.messages || []}
          renderItem={renderMessage}
          keyExtractor={item => item?._id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!text.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Wrapper component that provides the context
export default function ChatScreen() {
  return (
    <ConversationProvider>
      <ChatUI />
    </ConversationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  main: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 16,
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  assistantTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

