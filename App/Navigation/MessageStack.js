import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import RecentChats from '../Screens/Message';
import ChatThread from '../Screens/Message/ChatThread';
import GroupInfo from '../Screens/Message/GroupInfo';
import GroupMedia from '../Screens/Message/GroupMedia';
import CreatePersonalChat from '../Screens/Message/CreatePersonalChat';
import CreateGroupChat from '../Screens/Message/CreateGroupChat';

const Stack = createStackNavigator();

const MessageStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="RecentChats"
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="RecentChats"
                component={RecentChats}
            />
            <Stack.Screen
                name="ChatThread"
                component={ChatThread}
            />
            <Stack.Screen
                name="GroupInfo"
                component={GroupInfo}
            />
            <Stack.Screen
                name="GroupMedia"
                component={GroupMedia}
            />
            <Stack.Screen
                name="CreatePersonalChat"
                component={CreatePersonalChat}
            />
            <Stack.Screen
                name="CreateGroupChat"
                component={CreateGroupChat}
            />
        </Stack.Navigator>
    );
};

export default MessageStack;
