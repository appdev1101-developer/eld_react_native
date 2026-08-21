import React, { FC } from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

import Home from '../Screens/Home';
import AddInspection from '../Screens/Home/AddInspection';
import InspectionInfo from '../Screens/Home/InspectionInfo';
import Safety from '../Screens/Home/Safety';
import SingleSafety from '../Screens/Home/SingleSafety';
import UnsignedLog from '../Screens/Home/UnsignedLog';
import ApprovalRequestLogs from '../Screens/Home/ApprovalRequestLogs';
import InspectionHistory from '../Screens/Home/InspectionHistory';
import InspectionHistoryDetail from '../Screens/Home/InspectionHistoryDetail';

const Stack = createStackNavigator();

const stackScreenOptions: StackNavigationOptions = {
  headerShown: false,
};

const HomeStack: FC = () => {
  return (
    <Stack.Navigator initialRouteName="MainHome" screenOptions={stackScreenOptions}>
      <Stack.Screen name="MainHome" component={Home} />
      <Stack.Screen name="AddInspection" component={AddInspection} />
      <Stack.Screen name="InspectionInfo" component={InspectionInfo} />
      <Stack.Screen name="Safety" component={Safety} />
      <Stack.Screen name="SingleSafety" component={SingleSafety} />
      <Stack.Screen name="UnsignedLog" component={UnsignedLog} />
      <Stack.Screen name="ApprovalRequestLogs" component={ApprovalRequestLogs} />
      <Stack.Screen name="InspectionHistory" component={InspectionHistory} />
      <Stack.Screen
        name="InspectionHistoryDetail"
        component={InspectionHistoryDetail}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;