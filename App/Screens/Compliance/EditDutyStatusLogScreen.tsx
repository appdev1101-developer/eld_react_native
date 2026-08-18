// import React, { useCallback } from 'react';

// import {
//     ActivityIndicator,
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     View
// } from 'react-native';

// import {
//     Button,
//     Text
// } from 'react-native-basic-elements';

// import {
//     RouteProp,
//     useNavigation,
//     useRoute
// } from '@react-navigation/native';

// import EditDutyStatusHeader from './components/EditDutyStatusHeader';
// import TimeField from './components/TimeField';
// import DutyStatusSelector from './components/DutyStatusSelector';
// import LocationField from './components/LocationField';
// import NotesField from './components/NotesField';

// import {
//     useEditDutyStatus
// } from './hooks/useEditDutyStatus';

// import {
//     updateDutyStatus
// } from './services/editDutyStatus.service';

// import {
//     EditDutyStatusNavigationParams
// } from './types/editDutyStatus.types';

// import {
//     moderateScale
// } from '../../Constants/PixelRatio';

// import {
//     FONTS
// } from '../../Constants/Fonts';

// type RouteParams = {
//     EditDutyStatus: EditDutyStatusNavigationParams;
// };

// const EditDutyStatusLogScreen: React.FC = () => {
//     const navigation = useNavigation();

//     const route =
//         useRoute<
//             RouteProp<
//                 RouteParams,
//                 'EditDutyStatus'
//             >
//         >();

//     const { log } = route.params;

//     const {
//         form,
//         saving,
//         setSaving,
//         setStartTime,
//         setEndTime,
//         setDutyStatus,
//         setLocation,
//         setNotes
//     } = useEditDutyStatus(log);

//     const handleSave = useCallback(
//         async () => {
//             if (!form.location.trim()) {
//                 Alert.alert(
//                     'Validation',
//                     'Location is required.'
//                 );
//                 return;
//             }

//             if (
//                 form.endTime.getTime() <
//                 form.startTime.getTime()
//             ) {
//                 Alert.alert(
//                     'Validation',
//                     'End time cannot be earlier than start time.'
//                 );
//                 return;
//             }

//             try {
//                 setSaving(true);

//                 const response =
//                     await updateDutyStatus(
//                         log,
//                         form
//                     );

//                 if (response) {
//                     Alert.alert(
//                         'Success',
//                         'Duty status updated successfully.',
//                         [
//                             {
//                                 text: 'OK',
//                                 onPress: () =>
//                                     navigation.goBack()
//                             }
//                         ]
//                     );
//                 }
//             } catch (error) {
//                 if (__DEV__) {
//                     console.warn(
//                         'Failed to update duty status',
//                         error
//                     );
//                 }

//                 Alert.alert(
//                     'Error',
//                     'Unable to update duty status. Please try again.'
//                 );
//             } finally {
//                 setSaving(false);
//             }
//         },
//         [
//             form,
//             log,
//             navigation,
//             setSaving
//         ]
//     );

//     return (
//         <KeyboardAvoidingView
//             style={styles.container}
//             behavior={
//                 Platform.OS === 'ios'
//                     ? 'padding'
//                     : undefined
//             }
//         >
//             <EditDutyStatusHeader
//                 onBack={() =>
//                     navigation.goBack()
//                 }
//             />

//             <ScrollView
//                 showsVerticalScrollIndicator={false}
//                 keyboardShouldPersistTaps="handled"
//                 contentContainerStyle={
//                     styles.content
//                 }
//             >
//                 {/* 
//                     IMPORTANT:
//                     Reuse your existing working HOSChart here.

//                     Do NOT rebuild the chart specifically
//                     for this screen.
//                 */}

//                 <View style={styles.chartContainer}>
//                     {/* 
//                         <HOSChart
//                             ...
//                         />
//                     */}
//                 </View>

//                 <View style={styles.timeRow}>
//                     <TimeField
//                         label="Start Time"
//                         value={form.startTime}
//                         timezoneLabel="GMT"
//                         onChange={setStartTime}
//                     />

//                     <View
//                         style={styles.timeGap}
//                     />

//                     <TimeField
//                         label="End Time"
//                         value={form.endTime}
//                         timezoneLabel="GMT"
//                         onChange={setEndTime}
//                     />
//                 </View>

//                 <DutyStatusSelector
//                     value={form.dutyStatus}
//                     onChange={setDutyStatus}
//                 />

//                 <LocationField
//                     value={form.location}
//                     onChange={setLocation}
//                 />

//                 <NotesField
//                     value={form.notes}
//                     onChange={setNotes}
//                 />

//                 <Button
//                     title={
//                         saving
//                             ? 'Saving...'
//                             : 'Save'
//                     }
//                     disabled={saving}
//                     onPress={handleSave}
//                     style={styles.saveButton}
//                     textStyle={
//                         styles.saveButtonText
//                     }
//                 />
//             </ScrollView>

//             {saving && (
//                 <View
//                     style={styles.loadingOverlay}
//                 >
//                     <ActivityIndicator
//                         size="large"
//                         color="#FFFFFF"
//                     />
//                 </View>
//             )}
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#FFFFFF'
//     },

//     content: {
//         paddingHorizontal: moderateScale(14),
//         paddingBottom: moderateScale(30),
//         gap: moderateScale(25)
//     },

//     chartContainer: {
//         height: moderateScale(120),
//         marginHorizontal: moderateScale(-14)
//     },

//     timeRow: {
//         flexDirection: 'row'
//     },

//     timeGap: {
//         width: moderateScale(14)
//     },

//     saveButton: {
//         height: moderateScale(74),
//         borderRadius: moderateScale(15),
//         backgroundColor: '#1475ED'
//     },

//     saveButtonText: {
//         color: '#FFFFFF',
//         fontFamily: FONTS.ProductSans.regular,
//         fontSize: moderateScale(24)
//     },

//     loadingOverlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.25)',
//         alignItems: 'center',
//         justifyContent: 'center'
//     }
// });

// export default EditDutyStatusLogScreen;