import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import HomeCard from './HomeCard';
import { FONTS } from '../../Constants/Fonts';
import { THEME } from '../../Constants/Theme';

type Props = {
    driveTime: string;
    shiftTime: string;
    cycleTime: string;
};

type HOSCardProps = {
    time: string;
    label: string;
    subtitle: string;
};

const HOSCard: React.FC<HOSCardProps> = ({ time, label, subtitle }) => (
    <HomeCard style={{ gap: 5 }}>
        <View>
            <Text style={styles.numeral}>{time}</Text>
            <Text style={styles.unitLabel}>HRS</Text>
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </HomeCard>
);

const HOSDetails: React.FC<Props> = ({ driveTime, shiftTime, cycleTime }) => {
    return (
        <View style={styles.container}>
            <HOSCard
                time={driveTime}
                label="Drive"
                subtitle="11-Hour Driving Limit"
            />
            <HOSCard
                time={shiftTime}
                label="Shift"
                subtitle="14-hours on Duty Limit"
            />
            <HOSCard
                time={cycleTime}
                label="Cycle"
                subtitle="70 hours cycle limit"
            />
        </View>
    );
};

export default HOSDetails;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: moderateScale(18) + 15,
        justifyContent: 'space-between',
        marginTop: moderateScale(15),
        zIndex: 2
    },
    numeral: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(32),
        color: THEME.colors.textPrimary,
        textAlign: 'center',
        letterSpacing: -0.5
    },
    unitLabel: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(9),
        textTransform: 'uppercase',
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 1.2
    },
    cardLabel: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: THEME.colors.textPrimary,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    cardSubtitle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(9),
        color: THEME.colors.textSecondary,
        textAlign: 'center'
    }
});