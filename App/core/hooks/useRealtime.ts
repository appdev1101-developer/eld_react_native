import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
    Pusher,
    PusherEvent
} from '@pusher/pusher-websocket-react-native';
import SessionManager from '../session/SessionManager';
import {
    getPrivateUserChannel,
    getPusherAuthEndpoint,
    PUSHER_API_KEY,
    PUSHER_CLUSTER
} from '../realtime/pusherConfig';
import { authorizePusherChannel } from '../realtime/pusherAuth';

const CONNECT_TIMEOUT_MS = 30_000;
const FORCE_LOGOUT_EVENT = 'ForceLogoutEvent';

type UseRealtimeOptions = {
    loginStatus: boolean;
    userId?: number | string | null;
    onForceLogout: () => void | Promise<void>;
};

function isQuotaError(message: string): boolean {
    return message.toLowerCase().includes('over quota');
}

function handleForceLogoutEvent(event: PusherEvent, onForceLogout: () => void | Promise<void>) {
    if (event.eventName !== FORCE_LOGOUT_EVENT) {
        return;
    }

    try {
        const eventData = JSON.parse(event.data) as { type?: string };
        if (eventData.type === 'LOGOUT') {
            void onForceLogout();
        }
    } catch (error) {
        if (__DEV__) {
            console.warn('Failed to parse force logout event', error);
        }
    }
}

export function useRealtime({
    loginStatus,
    userId,
    onForceLogout
}: UseRealtimeOptions) {
    const pusherRef = useRef<Pusher | null>(null);
    const isConnectingRef = useRef(false);
    const onForceLogoutRef = useRef(onForceLogout);

    useEffect(() => {
        onForceLogoutRef.current = onForceLogout;
    }, [onForceLogout]);

    const disconnect = useCallback(async () => {
        const pusher = pusherRef.current;
        if (!pusher) {
            return;
        }

        try {
            await pusher.reset();
            await pusher.disconnect();
        } catch (error) {
            if (__DEV__) {
                console.warn('Pusher disconnect failed', error);
            }
        } finally {
            pusherRef.current = null;
            isConnectingRef.current = false;
        }
    }, []);

    const subscribeToUserChannel = useCallback(
        async (pusher: Pusher, resolvedUserId: number | string) => {
            const channelName = getPrivateUserChannel(resolvedUserId);

            await pusher.subscribe({
                channelName,
                onEvent: (event) => {
                    handleForceLogoutEvent(event, () => onForceLogoutRef.current());
                },
                onSubscriptionError: (_channel, message) => {
                    if (__DEV__) {
                        console.warn(`Pusher subscription error on ${channelName}:`, message);
                    }
                },
                onSubscriptionSucceeded: () => {
                    if (__DEV__) {
                        console.log(`Pusher subscribed to ${channelName}`);
                    }
                }
            });
        },
        []
    );

    useEffect(() => {
        let cancelled = false;

        const connect = async () => {
            if (!loginStatus || userId == null || userId === '') {
                await disconnect();
                return;
            }

            if (isConnectingRef.current) {
                return;
            }

            const timeoutId = setTimeout(() => {
                isConnectingRef.current = false;
            }, CONNECT_TIMEOUT_MS);

            try {
                isConnectingRef.current = true;

                const token = await SessionManager.getToken();
                if (!token || cancelled) {
                    return;
                }

                const existing = pusherRef.current;
                if (existing) {
                    await existing.disconnect();
                    pusherRef.current = null;
                }

                const pusher = Pusher.getInstance();
                if (!pusher || cancelled) {
                    return;
                }

                const authEndpoint = getPusherAuthEndpoint();

                await pusher.init({
                    apiKey: PUSHER_API_KEY,
                    cluster: PUSHER_CLUSTER,
                    authEndpoint,
                    useTLS: true,
                    onAuthorizer: (channelName, socketId) =>
                        authorizePusherChannel(authEndpoint, token, channelName, socketId),
                    onConnectionStateChange: (currentState) => {
                        if (currentState.toLowerCase() === 'connected' && !cancelled) {
                            void subscribeToUserChannel(pusher, userId);
                        }
                    },
                    onError: (message) => {
                        if (isQuotaError(message)) {
                            Alert.alert(
                                'Real-time Features Unavailable',
                                'Live updates are temporarily disabled due to service limits. The app will continue to work normally.',
                                [{ text: 'OK' }]
                            );
                        } else if (__DEV__) {
                            console.warn('Pusher error:', message);
                        }
                        isConnectingRef.current = false;
                    },
                    onSubscriptionError: (channelName, message) => {
                        if (__DEV__) {
                            console.warn(
                                `Pusher subscription error on ${channelName}:`,
                                message
                            );
                        }
                    }
                });

                if (cancelled) {
                    return;
                }

                pusherRef.current = pusher;
                await pusher.connect();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Pusher initialization failed';

                if (!isQuotaError(message) && __DEV__) {
                    console.warn('Pusher initialization failed:', message);
                }
            } finally {
                clearTimeout(timeoutId);
                isConnectingRef.current = false;
            }
        };

        void connect();

        return () => {
            cancelled = true;
        };
    }, [disconnect, loginStatus, subscribeToUserChannel, userId]);

    useEffect(() => {
        if (!loginStatus) {
            void disconnect();
        }
    }, [disconnect, loginStatus]);

    useEffect(() => {
        return () => {
            void disconnect();
        };
    }, [disconnect]);

    return { disconnect };
}