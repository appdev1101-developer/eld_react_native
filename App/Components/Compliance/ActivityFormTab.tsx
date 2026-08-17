import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, Picker } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';

import FormField from './FormField';
import FormSection from './FormSection';
import FormDivider from './FormDivider';
import { CoDriver, EditActivityFormValues } from '../../core/api/types/singleActivity';

interface ActivityFormChangeHandlers {
    distance: (value: string) => void;
    odometer: (value: string) => void;
    driverName: (value: string) => void;
    carrierName: (value: string) => void;
    mainOfficeAddress: (value: string) => void;
    homeTerminalAddress: (value: string) => void;
    coDriver: (value: string) => void;
    origin: (value: string) => void;
    destination: (value: string) => void;
}

interface Props {
    values: EditActivityFormValues;
    coDrivers: CoDriver[];
    onChange: ActivityFormChangeHandlers;
    onSubmit: () => void;
}

const ActivityFormTab: React.FC<Props> = ({
    values,
    coDrivers,
    onChange,
    onSubmit
}) => {
    return (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.container}
        >
            <FormSection title="GENERAL">
                <View style={styles.twoColumn}>
                    <View style={styles.distanceColumn}>
                        <FormField
                            title="Distance"
                            value={values.distance}
                            onChangeText={onChange.distance}
                            keyboardType="numeric"
                            containerStyle={styles.columnField}
                        />
                    </View>

                    <View style={styles.odometerColumn}>
                        <FormField
                            title="Odometers"
                            value={values.odometer}
                            onChangeText={onChange.odometer}
                            keyboardType="numeric"
                            containerStyle={styles.columnField}
                        />
                    </View>
                </View>

                <FormField
                    title="Driver"
                    value={values.driverName}
                    onChangeText={onChange.driverName}
                />
            </FormSection>

            <FormSection title="CARRIER">
                <FormField
                    title="Carrier Name"
                    value={values.carrierName}
                    onChangeText={onChange.carrierName}
                />

                <FormDivider />

                <FormField
                    title="Main Office Address"
                    value={values.mainOfficeAddress}
                    onChangeText={onChange.mainOfficeAddress}
                />

                <FormDivider />

                <FormField
                    title="Home Terminal Address"
                    value={values.homeTerminalAddress}
                    onChangeText={onChange.homeTerminalAddress}
                />
            </FormSection>

            <FormSection title="OTHER">
                <Picker
                    options={coDrivers.map(driver => ({
                        label: `${driver.first_name} ${driver.last_name}`,
                        value: String(driver.id)
                    }))}
                    selectedValue={values.coDriverId}
                    containerStyle={styles.picker}
                    placeholder="Select Co-Driver"
                    onValueChange={onChange.coDriver}
                />

                <FormDivider />

                <FormField
                    title="Origin"
                    value={values.origin}
                    onChangeText={onChange.origin}
                />

                <FormDivider />

                <FormField
                    title="Destination"
                    value={values.destination}
                    onChangeText={onChange.destination}
                />
            </FormSection>

            <AppButton
                title="Submit"
                textStyle={styles.buttonText}
                style={styles.button}
                onPress={onSubmit}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: moderateScale(25)
    },
    twoColumn: {
        borderWidth: 1,
        borderColor: '#C4C4C4',
        flexDirection: 'row'
    },
    distanceColumn: {
        flex: 1,
        paddingTop: moderateScale(8)
    },
    odometerColumn: {
        width: '35%',
        borderLeftWidth: 1,
        borderColor: '#C4C4C4',
        paddingTop: moderateScale(8)
    },
    columnField: {
        marginHorizontal: moderateScale(10),
        marginTop: 0
    },
    picker: {
        borderWidth: 0,
        marginTop: 0
    },
    button: {
        backgroundColor: 'green',
        marginTop: moderateScale(15)
    },
    buttonText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        color: '#fff'
    }
});

export default ActivityFormTab;
