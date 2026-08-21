import React, { ReactNode } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { moderateScale } from '../Constants/PixelRatio';
import { THEME } from '../Constants/Theme';

import AccountSetting from '../Screens/Settings/AccountSetting';
import Notification from '../Screens/Notification';

import HomeStack from './HomeStack';
import ComplianceStack from './ComplianceStack';
import MessageStack from './MessageStack';

import NotificationTabIcon from '../Components/NotificationTabIcon';

/**
 * Bottom tab route definitions.
 *
 * These types provide type-safe navigation throughout the application.
 */
export type BottomTabParamList = {
    Home: undefined;
    Messages: undefined;
    Compliance: undefined;
    Notification: undefined;
    Profile: undefined;
};

// Tab bar rendered height.
const TAB_BAR_HEIGHT = moderateScale(46);

// Extra bottom content spacing so screen content is not hidden
// behind the absolute-positioned tab bar.
const TAB_BAR_CONTENT_HEIGHT = moderateScale(60);

interface ScreenWrapperProps {
    children: ReactNode;
}

/**
 * Adds bottom padding to screen content because the tab bar uses
 * position: 'absolute' and overlays the screen.
 */
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.screenWrapper,
                {
                    paddingBottom:
                        TAB_BAR_CONTENT_HEIGHT + insets.bottom,
                },
            ]}
        >
            {children}
        </View>
    );
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTab: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: THEME.colors.primary,
                    height: TAB_BAR_HEIGHT + insets.bottom,
                    paddingBottom:
                        insets.bottom > 0
                            ? insets.bottom
                            : moderateScale(6),
                    paddingTop: moderateScale(6),
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 6,
                    shadowColor: THEME.colors.primary,
                    shadowOffset: {
                        width: 0,
                        height: -3,
                    },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    borderTopWidth: 0,
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: THEME.colors.accent,
                tabBarInactiveTintColor:
                    'rgba(255, 255, 255, 0.65)',
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="Home"
                children={() => (
                    <ScreenWrapper>
                        <HomeStack />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            source={require('../Assets/TabIcon/Home.png')}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Messages"
                children={() => (
                    <ScreenWrapper>
                        <MessageStack />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            source={require('../Assets/Icons/Chat.png')}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Compliance"
                children={() => (
                    <ScreenWrapper>
                        <ComplianceStack />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            source={require('../Assets/TabIcon/Menu.png')}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Notification"
                children={() => (
                    <ScreenWrapper>
                        <Notification />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <NotificationTabIcon
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                children={() => (
                    <ScreenWrapper>
                        <AccountSetting
                            headerTitle="Profile"
                            showBack={true}
                        />
                    </ScreenWrapper>
                )}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            source={require('../Assets/TabIcon/Profile.png')}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

interface TabIconProps {
    source: number;
    focused: boolean;
    color: string;
}

/**
 * Reusable icon component for bottom tab items.
 */
const TabIcon: React.FC<TabIconProps> = ({
    source,
    focused,
    color,
}) => {
    return (
        <View style={styles.tabIconContainer}>
            <Image
                source={source}
                style={[
                    styles.icon,
                    { tintColor: color } as ImageStyle,
                ]}
            />

            {focused && (
                <View
                    style={[
                        styles.focusIndicator,
                        {
                            backgroundColor: color,
                        },
                    ]}
                />
            )}
        </View>
    );
};

export default BottomTab;

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
    },

    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(2),
        minHeight: moderateScale(36),
        gap: moderateScale(3),
    },

    icon: {
        height: moderateScale(22),
        width: moderateScale(22),
        resizeMode: 'contain',
    },

    focusIndicator: {
        height: moderateScale(3),
        width: moderateScale(16),
        borderRadius: moderateScale(2),
        marginTop: moderateScale(2),
    },
});