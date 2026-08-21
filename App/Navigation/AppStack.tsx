import React, { FC } from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

import BottomTab from './BottomTab';
import DrawerNavigation from './DrawerNavigation';
import AccountSetting from '../Screens/Settings/AccountSetting';

type RootStackParamList = {
  Drawer: undefined;
  AccountSetting: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

const AppStack: FC = () => {
  return (
    <Stack.Navigator initialRouteName="Drawer" screenOptions={screenOptions}>
      <Stack.Screen name="Drawer" component={DrawerNavigation} />
      <Stack.Screen name="AccountSetting" component={AccountSetting} />
    </Stack.Navigator>
  );
};

export default AppStack;