//import liraries
import { createStackNavigator } from '@react-navigation/stack';
import React, { Component } from 'react';
import Home from '../Screens/Home';
import AddInspection from '../Screens/Home/AddInspection';
import InspectionInfo from '../Screens/Home/InspectionInfo';
import Compliance from '../Screens/Compliance';
import SingleActivity from '../Screens/Compliance/SingleActivity';
import Safety from '../Screens/Home/Safety';
import SingleSafety from '../Screens/Home/SingleSafety';
import UnsignedLog from '../Screens/Home/UnsignedLog';
import ApprovalRequestLogs from '../Screens/Home/ApprovalRequestLogs';
import InspectionHistory from '../Screens/Home/InspectionHistory';
import InspectionHistoryDetail from '../Screens/Home/InspectionHistoryDetail';

const Stack = createStackNavigator();

const HomeStack = () => {
    // const { login_status } = useSelector(state => state.User)
    return (
        <Stack.Navigator
            initialRouteName="MainHome"
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="MainHome"
                component={Home}
            />
            <Stack.Screen
                name="AddInspection"
                component={AddInspection}
            />
            <Stack.Screen
                name="InspectionInfo"
                component={InspectionInfo}
            />
            {/* <Stack.Screen name="Compliance" component={Compliance} /> */}
            <Stack.Screen
                name="SingleActivity"
                component={SingleActivity}
                options={{
                    unmountOnBlur: true
                }}
            />
            <Stack.Screen
                name="Safety"
                component={Safety}
            />
            <Stack.Screen
                name="SingleSafety"
                component={SingleSafety}
            />
            <Stack.Screen
                name="UnsignedLog"
                component={UnsignedLog}
            />
            <Stack.Screen
                name="ApprovalRequestLogs"
                component={ApprovalRequestLogs}
            />
            <Stack.Screen
                name="InspectionHistory"
                component={InspectionHistory}
            />
            <Stack.Screen
                name="InspectionHistoryDetail"
                component={InspectionHistoryDetail}
            />
        </Stack.Navigator>
    );
};

export default HomeStack;
