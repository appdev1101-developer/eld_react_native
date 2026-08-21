import React from 'react';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';

import SignIn from '../Screens/Auth/SignIn';
import Welcome from '../Screens/Auth/Welcome';
import Register from '../Screens/Auth/Register';
import ForgotPassword from '../Screens/Auth/ForgotPassword';
import OtpVerification from '../Screens/Auth/OtpVerification';
import CreateNewPassword from '../Screens/Auth/CreateNewPassword';
import PasswordChanged from '../Screens/Auth/PasswordChanged';

/**
 * Auth Stack Route Parameters
 */
export type AuthStackParamList = {
    Welcome: undefined;
    SignIn: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    OtpVerification: {
        otp: string;
        email: string;
    };
    CreateNewPassword: {
        email: string;
    };
    PasswordChanged: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="Welcome"
                component={Welcome}
            />

            <Stack.Screen
                name="SignIn"
                component={SignIn}
            />

            <Stack.Screen
                name="Register"
                component={Register}
            />

            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
            />

            <Stack.Screen
                name="OtpVerification"
                component={OtpVerification}
            />

            <Stack.Screen
                name="CreateNewPassword"
                component={CreateNewPassword}
            />

            <Stack.Screen
                name="PasswordChanged"
                component={PasswordChanged}
            />
        </Stack.Navigator>
    );
};

export default AuthStack;