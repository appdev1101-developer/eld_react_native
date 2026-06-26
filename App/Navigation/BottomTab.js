//import liraries
import React, { Component } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { moderateScale } from '../Constants/PixelRatio';
import { Container, Icon } from 'react-native-basic-elements';
import { Image, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Profile from '../Screens/Profile';
import AccountSetting from '../Screens/Settings/AccountSetting';
import ActivityLog from '../Screens/Activity/ActivityLog';
import HomeStack from './HomeStack';
import Notification from '../Screens/Notification';
import Compliance from '../Screens/Compliance';
import MessageStack from './MessageStack';

// Wrapper component to add padding for bottom tab
const ScreenWrapper = ({ children }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, paddingBottom: moderateScale(60) + insets.bottom }}>
            {children}
        </View>
    );
};

const Tab = createBottomTabNavigator();

const BottomTab = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#392969',
                    height: moderateScale(50) + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : moderateScale(8),
                    paddingTop: moderateScale(8),
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    borderTopWidth: 0,
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#FF9A62',
                tabBarInactiveTintColor: '#FFFFFF',
                tabBarHideOnKeyboard: true,
            })}
        >
            <Tab.Screen
                name="Home"
                children={() => <ScreenWrapper><HomeStack /></ScreenWrapper>}
                options={{
                    tabBarIcon: ({ focused, color }) => {
                        return (
                            <View style={styles.tabIconContainer}>
                                <Image
                                    source={require('../Assets/TabIcon/Home.png')}
                                    style={styles.icon}
                                    tintColor={color}
                                />
                                {focused && <View style={[styles.focusIndicator, { backgroundColor: color }]} />}
                            </View>
                        )
                    }
                }}
            />

            <Tab.Screen
                name="Messages"
                children={() => <ScreenWrapper><MessageStack /></ScreenWrapper>}
                options={{
                    tabBarIcon: ({ focused, color }) => {
                        return (
                            <View style={styles.tabIconContainer}>
                                <Image
                                    source={require('../Assets/Icons/Chat.png')}
                                    style={styles.icon}
                                    tintColor={color}
                                />
                                {focused && <View style={[styles.focusIndicator, { backgroundColor: color }]} />}
                            </View>
                        )
                    }
                }}
            />

            <Tab.Screen
                name="Compliance"
                children={() => <ScreenWrapper><Compliance /></ScreenWrapper>}
                options={{
                    tabBarIcon: ({ focused, color }) => {
                        return (
                            <View style={styles.tabIconContainer}>
                                <Image
                                    source={require('../Assets/TabIcon/Menu.png')}
                                    style={styles.icon}
                                    tintColor={color}
                                />
                                {focused && <View style={[styles.focusIndicator, { backgroundColor: color }]} />}
                            </View>
                        )
                    }
                }}
            />

            <Tab.Screen
                name="Nitification"
                children={() => <ScreenWrapper><Notification /></ScreenWrapper>}
                options={{
                    tabBarIcon: ({ focused, color }) => {
                        return (
                            <View style={styles.tabIconContainer}>
                                <Image
                                    source={require('../Assets/TabIcon/Notification.png')}
                                    style={styles.icon}
                                    tintColor={color}
                                />
                                {focused && <View style={[styles.focusIndicator, { backgroundColor: color }]} />}
                            </View>
                        )
                    }
                }}
            />

            <Tab.Screen
                name="Profile"
                children={() => (
                    <ScreenWrapper>
                        <AccountSetting headerTitle="Profile" showBack={false} />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => {
                        return (
                            <View style={styles.tabIconContainer}>
                                <Image
                                    source={require('../Assets/TabIcon/Profile.png')}
                                    style={styles.icon}
                                    tintColor={color}
                                />
                                {focused && <View style={[styles.focusIndicator, { backgroundColor: color }]} />}
                            </View>
                        )
                    }
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTab;

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(4),
        minHeight: moderateScale(40),
        gap: moderateScale(4)
    },
    icon: {
        height: moderateScale(24),
        width: moderateScale(24),
        resizeMode: 'contain'
    },
    focusIndicator: {
        height: moderateScale(4),
        width: moderateScale(4),
        borderRadius: moderateScale(2),
        marginTop: moderateScale(2)
    }
})
