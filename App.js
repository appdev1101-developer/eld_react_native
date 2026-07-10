import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Theme, useTheme } from 'react-native-basic-elements';
import AppStatusBar from './App/Components/AppStatusBar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import SessionManager from './App/core/session/SessionManager';
import { performLogout } from './App/core/hooks/useSession';
import { useRealtime } from './App/core/hooks/useRealtime';
import AppStack from './App/Navigation/AppStack';
import NavigationService from './App/Services/Navigation';
import AuthStack from './App/Navigation/AuthStack';
import { COLORS } from './App/Constants/Colors';
import { ensureEldConnectionBeepListener } from './App/Utils/EldConnectionBeep';
import {
    requestEldPermissions,
    watchEldPermissionsOnResume
} from './App/Utils/EldPermissions';
import GeoDataBackgroundService from './App/Utils/GeoDataService';
import PushNotification from './App/Utils/PushNotification';
import messageWebSocket from './App/Utils/MessageWebSocket';
import NetworkProvider from './App/Components/UI/NetworkProvider';

const Stack = createStackNavigator();

const App = () => {
    const dispatch = useDispatch();
    useTheme();

    const { loginStatus, userData } = useSelector((state) => state.User);

    const [isLoading, setIsLoading] = useState(true);
    const [isdark, setIsDark] = useState(false);

    const handleForceLogout = useCallback(() => {
        Alert.alert(
            'Session Expired',
            'You have been logged out because your account was accessed from another device.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        performLogout(dispatch);
                    }
                }
            ]
        );
    }, [dispatch]);

    const { disconnect: disconnectRealtime } = useRealtime({
        loginStatus,
        userId: userData?.id ?? userData?.driver_id ?? null,
        onForceLogout: handleForceLogout
    });

    useEffect(() => {
        ensureEldConnectionBeepListener();
        SessionManager.restoreSession()
            .catch((err) => {
                if (__DEV__) {
                    console.warn('Session restore failed', err);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });

        const stopWatchingPermissions = watchEldPermissionsOnResume(() => {
            GeoDataBackgroundService.restoreIfNeeded().catch(() => {});
        });

        return stopWatchingPermissions;
    }, []);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        const interaction = InteractionManager.runAfterInteractions(() => {
            requestEldPermissions()
                .then((status) => {
                    if (__DEV__) {
                        console.log('ELD permission status:', status);
                    }
                })
                .catch((error) => {
                    if (__DEV__) {
                        console.warn('ELD permission request failed:', error);
                    }
                });
        });

        return () => interaction.cancel();
    }, [isLoading]);

    useEffect(() => {
        if (!loginStatus) return;
        GeoDataBackgroundService.restoreIfNeeded().catch(() => {});
    }, [loginStatus]);

    useEffect(() => {
        return PushNotification.initialize({
            onNotificationOpened: () => {
                NavigationService.navigate('AppStack', {
                    screen: 'Drawer',
                    params: {
                        screen: 'BottomTab',
                        params: { screen: 'Notification' }
                    }
                });
            }
        });
    }, []);

    useEffect(() => {
        PushNotification.setAuthState({
            isLoggedIn: loginStatus,
            userId: userData?.id ?? userData?.driver_id ?? null
        });

        if (loginStatus) {
            PushNotification.registerIfNeeded().catch(() => {});
        }
    }, [loginStatus, userData?.id, userData?.driver_id]);

    useEffect(() => {
        if (!loginStatus) {
            messageWebSocket.disconnect();
            disconnectRealtime().catch(() => {});
            return;
        }
        //ToDo: I manually commented this code. Need to verify.
        messageWebSocket.connect().catch((error) => {
            console.warn('MessageWebSocket connect failed', error);
        });
    }, [disconnectRealtime, loginStatus]);

    return (
        <GestureHandlerRootView
            style={{
                flex: 1,
                backgroundColor: '#fff'
            }}
        >
            <AppStatusBar />

            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <Theme.Provider
                    theme={{
                        light: {
                            primaryThemeColor: '#F44336',
                            secondaryThemeColor: '#FFFFFF',
                            primaryFontColor: COLORS.light.primaryFontColor,
                            secondaryFontColor: '#60D669',
                            cardColor: COLORS.light.cardColor,
                            headerColor: '#FFFFFF',
                            pageBackgroundColor: '#FFFFFF',
                            tabBarColor: '#D3D3D3',
                            shadowColor: '#999',
                            statusBarStyle: 'dark-content',
                            buttonColor: COLORS.light.buttonColor,
                            secondaryButtoncolor: '#147C32',
                            boxColor: 'rgba(104, 185, 46, 0.2)',
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            themeborderColor: 'rgba(248, 137, 129, 0.35)',
                            subTxtColor: 'rgba(37, 51, 58, 0.7)',
                            white: '#FFFFFF',
                            greycardColor: 'rgba(244, 67, 54, 0.10)'
                        },
                        dark: {
                            primaryThemeColor: '#F44336',
                            secondaryThemeColor: '#FFFFFF',
                            primaryFontColor: '#25333A',
                            secondaryFontColor: '#60D669',
                            cardColor: 'rgba(244, 67, 54, 0.4)',
                            headerColor: '#FFFFFF',
                            pageBackgroundColor: '#FFFFFF',
                            tabBarColor: '#D3D3D3',
                            shadowColor: '#999',
                            statusBarStyle: 'dark-content',
                            buttonColor: '#F44336',
                            secondaryButtoncolor: '#147C32',
                            boxColor: 'rgba(104, 185, 46, 0.2)',
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            themeborderColor: 'rgba(248, 137, 129, 0.35)',
                            subTxtColor: 'rgba(37, 51, 58, 0.7)',
                            white: '#FFFFFF',
                            greycardColor: 'rgba(244, 67, 54, 0.10)'
                        }
                    }}
                    mode={!isdark ? 'light' : 'dark'}
                >
                    <SafeAreaProvider>
                        <BottomSheetModalProvider>
                        <NetworkProvider>
                            <NavigationContainer
                                ref={(r) => NavigationService.setTopLevelNavigator(r)}
                            >
                                <Stack.Navigator
                                    initialRouteName="AuthStack"
                                    screenOptions={{
                                        headerShown: false
                                    }}
                                >
                                    {!loginStatus ? (
                                        <Stack.Screen
                                            name="AuthStack"
                                            component={AuthStack}
                                        />
                                    ) : (
                                        <Stack.Screen
                                            name="AppStack"
                                            component={AppStack}
                                        />
                                    )}
                                </Stack.Navigator>
                            </NavigationContainer>
                        </NetworkProvider>
                        </BottomSheetModalProvider>
                    </SafeAreaProvider>
                </Theme.Provider>
            )}
        </GestureHandlerRootView>
    );
};

export default App;