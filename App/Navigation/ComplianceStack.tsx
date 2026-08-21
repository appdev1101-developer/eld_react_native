import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Compliance from '../Screens/Compliance';
import SingleActivity from '../Screens/Compliance/SingleActivity';
import EditDutyStatusLogScreen from '../Screens/Compliance/EditDutyStatusLogScreen';

/**
 * Defines all routes and their parameter types for ComplianceStack.
 */
export type ComplianceStackParamList = {
    ComplianceHome: undefined;
    SingleActivity: undefined;
    EditDutyStatusLog: undefined;
};

const Stack = createStackNavigator<ComplianceStackParamList>();

/**
 * Compliance navigator.
 *
 * Gives the Compliance tab its own navigation stack so that
 * SingleActivity and EditDutyStatusLog can be accessed while
 * the Compliance tab is focused.
 */
const ComplianceStack: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="ComplianceHome"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="ComplianceHome"
                component={Compliance}
            />

            <Stack.Screen
                name="SingleActivity"
                component={SingleActivity}
                // options={{
                //     unmountOnBlur: true,
                // }}
            />

            <Stack.Screen
                name="EditDutyStatusLog"
                component={EditDutyStatusLogScreen}
            />
        </Stack.Navigator>
    );
};

export default ComplianceStack;