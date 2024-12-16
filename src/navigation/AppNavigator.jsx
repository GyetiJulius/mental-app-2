import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ChatScreen from '../screens/ChatScreen';
import { ConversationProvider } from '../contexts/ConversationContext';

const Stack = createNativeStackNavigator();

// Create a wrapped version of ChatScreen
const WrappedChatScreen = (props) => (
  <ConversationProvider>
    <ChatScreen {...props} />
  </ConversationProvider>
);

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen 
        name="Chat" 
        component={WrappedChatScreen}
        options={{
          unmountOnBlur: true // This ensures the component is unmounted when navigating away
        }}
      />
    </Stack.Navigator>
  );
} 