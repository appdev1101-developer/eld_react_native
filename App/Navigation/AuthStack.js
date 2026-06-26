//import liraries
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import React, { Component } from 'react';
import SignIn from '../Screens/Auth/SignIn';
import Welcome from '../Screens/Auth/Welcome';
import Register from '../Screens/Auth/Register';
import ForgotPassword from '../Screens/Auth/ForgotPassword';
import OtpVerification from '../Screens/Auth/OtpVerification';
import CreateNewPassword from '../Screens/Auth/CreateNewPassword';
import PasswordChanged from '../Screens/Auth/PasswordChanged';

const Stack = createStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false
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
