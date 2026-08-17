import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { SingleActivityTab } from '../../core/api/types/singleActivity';


interface Props {
    selectedTab: SingleActivityTab;
    onChange: (tab: SingleActivityTab) => void;
}

const TABS: Array<{ key: SingleActivityTab; label: string }> = [
    { key: 'log', label: 'Log' },
    { key: 'form', label: 'Form' },
    { key: 'sign', label: 'Sign' }
];

const ActivityTabs: React.FC<Props> = ({ selectedTab, onChange }) => (
    <View style={styles.container}>
        {TABS.map(tab => (
            <Pressable
                key={tab.key}
                style={[
                    styles.tab,
                    selectedTab === tab.key && styles.activeTab
                ]}
                onPress={() => onChange(tab.key)}
            >
                <Text style={styles.label}>{tab.label}</Text>
            </Pressable>
        ))}
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#D9D9D9',
        marginTop: moderateScale(8),
        height: moderateScale(45),
        flexDirection: 'row'
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activeTab: {
        borderBottomColor: '#392969',
        borderBottomWidth: moderateScale(7)
    },
    label: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18)
    }
});

export default ActivityTabs;
