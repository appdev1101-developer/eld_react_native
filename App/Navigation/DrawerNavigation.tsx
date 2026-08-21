import React, { FC } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import BottomTab from './BottomTab';
import ConnectELD from '../Screens/Home/ConnectELD';
import CustomDrawerContent from './CustomDrawerContent';
import DotInspection from '../Screens/Home/DotInspection';

const Drawer = createDrawerNavigator();

const { width }: { width: number } = Dimensions.get('window');

const DrawerNavigation: FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="ConnectELD"
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: (width * 80) / 100,
        },
      }}
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="ConnectELD" component={ConnectELD} />
      <Drawer.Screen name="BottomTab" component={BottomTab} />
      <Drawer.Screen name="DotInspection" component={DotInspection} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigation;