import { PusherAuthorizerResult } from '@pusher/pusher-websocket-react-native';

export async function authorizePusherChannel(
    authEndpoint: string,
    token: string,
    channelName: string,
    socketId: string
): Promise<PusherAuthorizerResult> {
    console.log("<<<<<<< Pusher EndPoint >>>>>>>>", authEndpoint);
    const params= JSON.stringify({
            socket_id: socketId,
            channel_name: channelName
        });
    console.log("<<<<<<< Pusher params >>>>>>>>", params.toString());
    const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: params
    });
    console.log("<<<<<<< Pusher Response >>>>>>>>", response);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = (await response.json()) as PusherAuthorizerResult;
    return {
        auth: data.auth,
        channel_data: data.channel_data,
        shared_secret: data.shared_secret
    };
}