import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';

export default function ConversationDrawer({
  conversations,
  currentConversation,
  onSelectConversation,
  onClose,
  onNewConversation,
  onDeleteConversation
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conversations</Text>
      </View>

      <TouchableOpacity 
        style={styles.newChatButton}
        onPress={onNewConversation}
      >
        <Text style={styles.newChatButtonText}>+ New Chat</Text>
      </TouchableOpacity>

      <ScrollView style={styles.conversationList}>
        {conversations?.map((conversation) => (
          <TouchableOpacity
            key={conversation._id || Math.random().toString()}
            style={[
              styles.conversationItem,
              currentConversation?._id === conversation._id && styles.selectedConversation
            ]}
            onPress={() => onSelectConversation(conversation)}
            onLongPress={() => onDeleteConversation(conversation._id)}
          >
            <Text 
              style={[
                styles.conversationTitle,
                currentConversation?._id === conversation._id && styles.selectedConversationText
              ]}
              numberOfLines={1}
            >
              {conversation.title || 'Untitled'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 16,
  },
  newChatButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedConversation: {
    backgroundColor: '#f0f0f0',
  },
  conversationTitle: {
    fontSize: 16,
    color: '#333',
  },
  selectedConversationText: {
    color: '#007AFF',
  },
}); 