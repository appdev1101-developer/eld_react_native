/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { Provider } from 'react-redux';
import App from './App';
import { name as appName } from './app.json';
import Store from './App/Redux/store';
import PushNotification from './App/Utils/PushNotification';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    if (!remoteMessage.notification) {
        await PushNotification.displayRemoteMessage(remoteMessage);
    }
});

const Main = () => {
    return (
        <Provider
            store={Store}
        >
            <App />
        </Provider>
    )
}

AppRegistry.registerComponent(appName, () => Main);
