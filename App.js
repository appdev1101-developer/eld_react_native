import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, InteractionManager } from 'react-native';
import { Theme, useTheme } from 'react-native-basic-elements';
import AppStatusBar from './App/Components/AppStatusBar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from './App/Redux/reducer/User';
import AuthService from './App/Services/Auth';
import AppStack from './App/Navigation/AppStack';
import NavigationService from './App/Services/Navigation';
import AuthStack from './App/Navigation/AuthStack';
import { COLORS } from './App/Constants/Colors';
import { Pusher } from '@pusher/pusher-websocket-react-native';
import { ensureEldConnectionBeepListener } from './App/Utils/EldConnectionBeep';
import {
    requestEldPermissions,
    watchEldPermissionsOnResume
} from './App/Utils/EldPermissions';
import GeoDataBackgroundService from './App/Utils/GeoDataService';
import PushNotification from './App/Utils/PushNotification';
import messageWebSocket from './App/Utils/MessageWebSocket';

const Stack = createStackNavigator();

const App = () => {
    const dispatch = useDispatch();
    const colors = useTheme();

    const { loginStatus, userData } = useSelector((state) => state.User);

    const [isLoading, setIsLoading] = useState(true);
    const [isdark, setIsDark] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [pusherInstance, setPusherInstance] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        ensureEldConnectionBeepListener();
        ckhUser();

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
        const unsubscribe = PushNotification.setupPushNotificationListeners({
            onNotificationOpened: () => {
                if (loginStatus) {
                    NavigationService.navigate('AppStack', {
                        screen: 'Drawer',
                        params: {
                            screen: 'BottomTab',
                            params: { screen: 'Nitification' }
                        }
                    });
                }
            }
        });

        return unsubscribe;
    }, [loginStatus]);

    useEffect(() => {
        if (!loginStatus) {
            PushNotification.deleteFcmToken().catch(() => {});
            return;
        }

        PushNotification.syncFcmToken().catch(() => {});
    }, [loginStatus]);

    useEffect(() => {
        if (!loginStatus) {
            messageWebSocket.disconnect();
            return;
        }

        messageWebSocket.connect().catch((error) => {
            console.warn('MessageWebSocket connect failed', error);
        });
    }, [loginStatus]);

    // Handle Pusher connection when authentication changes
    useEffect(() => {
        let mounted = true;

        const initializePusher = async () => {
            console.log("bal", !loginStatus || !userData || isConnecting)
            console.log("loginStatus", loginStatus)
            console.log("userData", userData)
            console.log("isConnecting", isConnecting)
            if (!loginStatus || !userData || isConnecting) {
                console.log('clearing pusher upper');

                // Clean up if user logged out
                if (!loginStatus && pusherInstance) {
                    console.log('clearing pusher');
                    await clearPusherInstance();
                }
                return;
            }

            // Add timeout to prevent hanging
            const timeoutId = setTimeout(() => {
                setIsConnecting(false);
            }, 30000); // 30 second timeout

            try {
                setIsConnecting(true);

                const token = await AuthService.getToken();

                console.log("token", token)

                if (!token) {
                    return;
                }

                if (!mounted) {
                    return;
                }

                setAccessToken(token);

                // Clean up existing connection if any
                if (pusherInstance) {
                    console.log("clearing pusher instance")
                    await pusherInstance.disconnect();
                    setPusherInstance(null);
                }

                let pusher = Pusher.getInstance();

                if (!pusher) {
                    return;
                }

                console.log("pusher", pusher)

                await pusher.init({
                    apiKey: '7ede0e0642bfe8c67615',
                    cluster: 'ap2',
                    authEndpoint: 'https://uat.apnatelelink.us/broadcasting/auth',
                    useTLS: true,
                    onAuthorizer: async (channel, options) => {
                        console.log("channel", channel)
                        console.log("options", options)
                        const requestBody = JSON.stringify({
                            socket_id: options,
                            channel_name: channel
                        });

                        // Match Postman headers exactly - let fetch handle Host and Content-Length
                        const headers = {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: `Bearer ${token}`,
                            'X-Requested-With': 'XMLHttpRequest'
                        };

                        console.log("headers", headers)

                        try {
                            const fetchConfig = {
                                method: 'POST',
                                headers: headers,
                                body: requestBody
                            };

                            const response = await fetch(
                                'https://uat.apnatelelink.us/broadcasting/auth',
                                fetchConfig
                            );

                            console.log("response", response)

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(
                                    `HTTP ${response.status}: ${response.statusText}`
                                );
                            }

                            const data = await response.json();

                            return {
                                auth: data.auth,
                                channel_data: data.channel_data,
                                shared_secret: data.shared_secret
                            };
                        } catch (error) {
                            handleForceLogout();
                            console.error(
                                'Authorization failed for channel',
                                channel,
                                ':',
                                error.message
                            );
                            throw error;
                        }
                    },
                    onConnectionStateChange: (currentState, previousState) => {
                        console.log("currentState", currentState)
                        console.log("previousState", previousState, )
                        console.log("userData", userData)
                        if (currentState.toLowerCase() === 'connected') {
                            subscribeToUserChannel(pusher, userData.id || 98);
                        }
                    },
                    onError: (error) => {
                        console.error('Pusher Error:', error);

                        // Handle specific Pusher errors
                        if (error.message && error.message.includes('over quota')) {
                            Alert.alert(
                                'Real-time Features Unavailable',
                                'Live updates are temporarily disabled due to service limits. The app will continue to work normally.',
                                [{ text: 'OK' }]
                            );
                        }

                        setIsConnecting(false);
                    },
                    onSubscriptionError: (channelName, error) => {
                        console.error(`Subscription Error on ${channelName}:`, error);
                    }
                });

                if (!mounted) {
                    return;
                }

                const connectResult = await pusher.connect();

                if (!mounted) {
                    return;
                }
            } catch (error) {
                // Handle quota exceeded errors gracefully
                if (error.message && error.message.includes('over quota')) {
                    // App will continue without real-time features due to quota limits
                } else {
                    console.error('Pusher initialization failed:', error.message);
                }

                // Reset connecting state on error
                setIsConnecting(false);
            } finally {
                clearTimeout(timeoutId);
                if (mounted) {
                    setIsConnecting(false);
                }
            }
        };

        if (loginStatus && userData && !isConnecting) {
            initializePusher();
        } else if (!loginStatus) {
            // Clean up when logged out
            clearPusherInstance();
        }

        return () => {
            mounted = false;
        };
    }, [loginStatus, userData]);

    const clearPusherInstance = async () => {
        if (pusherInstance) {
            await pusherInstance.reset();
            await pusherInstance.disconnect();
            setPusherInstance(null);
        }
    };

    const subscribeToUserChannel = async (pusher, userId) => {
        setPusherInstance(pusher);

        console.log("userId", userId)
        await pusher.subscribe({
            channelName: `private-user-${userId || 98}`,
            onEvent: (event) => {
                console.log('Received event:', event);

                // Handle force logout event
                if (event.eventName === 'ForceLogoutEvent') {
                    try {
                        const eventData = JSON.parse(event.data);
                        if (eventData.type === 'LOGOUT') {
                            handleForceLogout();
                        }
                    } catch (error) {
                        console.error('Error parsing event data:', error);
                    }
                }
            },
            onSubscriptionError: (error) => {
                console.error('Channel subscription error:', error);
                if (error.message && error.message.includes('over quota')) {
                    // Falling back to polling for updates...
                    // You could implement a polling mechanism here as fallback
                }
            },
            onSubscriptionSucceeded: () => {
                console.log('Channel subscription successful');
            }
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pusherInstance) {
                pusherInstance.disconnect();
            }
        };
    }, [pusherInstance]);

    const ckhUser = () => {
        AuthService.getAccount()
            .then((result) => {
                setIsLoading(false);
                if (result) {
                    dispatch(setUser(result));
                }
            })
            .catch((err) => {
                console.log('err>>>', err);
                setIsLoading(false);
            });
    };

    // Handle force logout
    const handleForceLogout = () => {
        Alert.alert(
            'Session Expired',
            'You have been logged out because your account was accessed from another device.',
            [
                {
                    text: 'OK',
                    onPress: async () => {
                        // Clean up Pusher instance before logout
                        await clearPusherInstance();

                        // Reset Pusher-related states
                        setAccessToken(null);
                        setIsConnecting(false);

                        // Clear user session
                        AuthService.logout();
                        dispatch({ type: 'user/logout' });
                        // Navigation will automatically handle redirect to AuthStack
                    }
                }
            ]
        );
    };

    return (
        <View
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
                    </SafeAreaProvider>
                </Theme.Provider>
            )}
        </View>
    );
};

export default App;
