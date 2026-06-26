//import liraries
import { createStackNavigator } from '@react-navigation/stack';
import React, { Component } from 'react';
import BottomTab from './BottomTab';
import DrawerNavigation from './DrawerNavigation';
import AccountSetting from '../Screens/Settings/AccountSetting';

const Stack = createStackNavigator();

const AppStack = () => {
  // const { login_status } = useSelector(state => state.User)
  return (
    <Stack.Navigator
      initialRouteName="Drawer"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Drawer" component={DrawerNavigation} />
      <Stack.Screen name="AccountSetting" component={AccountSetting} />
    </Stack.Navigator>
  );
};

export default AppStack;
