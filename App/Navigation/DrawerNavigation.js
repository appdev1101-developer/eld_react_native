import { Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTab from './BottomTab';
import ConnectELD from '../Screens/Home/ConnectELD';
import CustomDrawerContent from './CustomDrawerContent';
import DotInspection from '../Screens/Home/DotInspection';
import MessageStack from './MessageStack';

const Drawer = createDrawerNavigator();

const { width } = Dimensions.get('window');
const DrawerNavigation = () => {
    return (
        <Drawer.Navigator
            initialRouteName="ConnectELD"
            screenOptions={{
                headerShown: false,
                drawerPosition: 'right',
                drawerStyle: {
                    backgroundColor: '#FFFFFF',
                    width: (width * 80) / 100
                }
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
            <Drawer.Screen
                name="ConnectELD"
                component={ConnectELD}
            />
            <Drawer.Screen
                name="BottomTab"
                component={BottomTab}
            />

            <Drawer.Screen
                name="DotInspection"
                component={DotInspection}
            />

            <Drawer.Screen
                name="Message"
                component={MessageStack}
            />
        </Drawer.Navigator>
    );
};

export default DrawerNavigation;
