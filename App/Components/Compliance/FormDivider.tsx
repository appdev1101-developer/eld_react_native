import React from 'react';
import { StyleSheet, View } from 'react-native';

const FormDivider: React.FC = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C4C4C4'
    }
});

export default FormDivider;
