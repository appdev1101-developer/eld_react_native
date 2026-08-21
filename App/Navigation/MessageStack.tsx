import React, { FC } from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

import RecentChats from '../Screens/Message';
import ChatThread from '../Screens/Message/ChatThread';
import GroupInfo from '../Screens/Message/GroupInfo';
import GroupMedia from '../Screens/Message/GroupMedia';
import CreatePersonalChat from '../Screens/Message/CreatePersonalChat';
import CreateGroupChat from '../Screens/Message/CreateGroupChat';

type MessageStackParamList = {
  RecentChats: undefined;
  ChatThread: undefined;
  GroupInfo: undefined;
  GroupMedia: undefined;
  CreatePersonalChat: undefined;
  CreateGroupChat: undefined;
};

const Stack = createStackNavigator<MessageStackParamList>();

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

const MessageStack: FC = () => {
  return (
    <Stack.Navigator initialRouteName="RecentChats" screenOptions={screenOptions}>
      <Stack.Screen name="RecentChats" component={RecentChats} />
      <Stack.Screen name="ChatThread" component={ChatThread} />
      <Stack.Screen name="GroupInfo" component={GroupInfo} />
      <Stack.Screen name="GroupMedia" component={GroupMedia} />
      <Stack.Screen name="CreatePersonalChat" component={CreatePersonalChat} />
      <Stack.Screen name="CreateGroupChat" component={CreateGroupChat} />
    </Stack.Navigator>
  );
};

export default MessageStack;