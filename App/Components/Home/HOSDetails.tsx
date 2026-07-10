import { DimensionValue, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { THEME } from '../../Constants/Theme';
import { findDutyStatus } from '../../Constants/dutyStatus';
import {
    getAccentedHosCard,
    getHosProgress,
    HosCardKind,
    HosUrgency
} from '../../core/hos/hosProgress';

type Props = {
    driveTime: string;
    shiftTime: string;
    cycleTime: string;
    currentDutyStatus?: string | null;
    loading?: boolean;
};

type HOSCardConfig = {
    kind: HosCardKind;
    label: string;
    subtitle: string;
    time: string;
};

type HOSCardProps = HOSCardConfig & {
    accentColor?: string;
    isAccented: boolean;
    isExpanded: boolean;
    loading?: boolean;
    onPress: () => void;
};

const URGENCY_COLORS: Record<HosUrgency, string> = {
    safe: THEME.colors.success,
    warning: THEME.colors.warning,
    critical: THEME.colors.error
};

const HOSCard: React.FC<HOSCardProps> = ({
    kind,
    label,
    subtitle,
    time,
    accentColor,
    isAccented,
    isExpanded,
    loading = false,
    onPress
}) => {
    const progress = loading ? null : getHosProgress(time, kind);
    const barColor = loading
        ? THEME.colors.border
        : URGENCY_COLORS[progress!.urgency];
    const barWidth: DimensionValue = loading
        ? '0%'
        : (`${Math.round(progress!.percentRemaining * 100)}%` as DimensionValue);
    const displayTime = loading ? '--' : time;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                isAccented && styles.cardAccented,
                isAccented && accentColor
                    ? { borderTopColor: accentColor }
                    : null,
                pressed && styles.cardPressed
            ]}
        >
            <View style={styles.timeBlock}>
                <Text style={styles.numeral}>{displayTime}</Text>
                <Text style={styles.unitLabel}>
                    {loading ? 'SYNC' : 'HRS'}
                </Text>
            </View>

            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={isExpanded ? 2 : 1}>
                {loading ? 'Syncing…' : subtitle}
            </Text>

            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: barWidth,
                            backgroundColor: barColor
                        }
                    ]}
                />
            </View>

            {isExpanded ? (
                <Text style={[styles.expandText, { color: barColor }]}>
                    {loading || !progress
                        ? 'Updating limits…'
                        : `${progress.remainingLabel} left · ${progress.limitLabel}`}
                </Text>
            ) : null}
        </Pressable>
    );
};

const HOSDetails: React.FC<Props> = ({
    driveTime,
    shiftTime,
    cycleTime,
    currentDutyStatus,
    loading = false
}) => {
    const [expandedKind, setExpandedKind] = useState<HosCardKind | null>(null);
    const accentedKind = getAccentedHosCard(currentDutyStatus);
    const statusVisual = findDutyStatus(currentDutyStatus);

    const cards: Array<HOSCardConfig> = [
        {
            kind: 'drive',
            label: 'Drive',
            subtitle: '11 hours Driving Limit',
            time: driveTime
        },
        {
            kind: 'shift',
            label: 'Shift',
            subtitle: '14 hours on Duty Limit',
            time: shiftTime
        },
        {
            kind: 'cycle',
            label: 'Cycle',
            subtitle: '70 hours cycle limit',
            time: cycleTime
        }
    ];

    const toggleExpand = (kind: HosCardKind) => {
        setExpandedKind((current) => (current === kind ? null : kind));
    };

    return (
        <View style={styles.container}>
            {cards.map((card) => (
                <HOSCard
                    key={card.kind}
                    {...card}
                    loading={loading}
                    isAccented={accentedKind === card.kind}
                    accentColor={statusVisual?.themeColor}
                    isExpanded={expandedKind === card.kind}
                    onPress={() => toggleExpand(card.kind)}
                />
            ))}
        </View>
    );
};

export default HOSDetails;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: moderateScale(18),
        justifyContent: 'space-between',
        marginTop: moderateScale(15),
        zIndex: 2,
        gap: moderateScale(8)
    },
    card: {
        width: '31%',
        minHeight: moderateScale(148),
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.lg,
        alignItems: 'center',
        paddingTop: moderateScale(16),
        paddingHorizontal: moderateScale(6),
        paddingBottom: moderateScale(10),
        borderWidth: 1,
        borderColor: THEME.colors.borderLight,
        borderTopWidth: 3,
        borderTopColor: 'transparent',
        ...THEME.shadow.card
    },
    cardAccented: {
        backgroundColor: THEME.colors.surfaceMuted
    },
    cardPressed: {
        opacity: 0.94
    },
    timeBlock: {
        alignItems: 'center'
    },
    numeral: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(28),
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
        fontSize: moderateScale(15),
        color: THEME.colors.textPrimary,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: moderateScale(4)
    },
    cardSubtitle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(8),
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        marginTop: moderateScale(2),
        minHeight: moderateScale(12)
    },
    progressTrack: {
        width: '88%',
        height: moderateScale(5),
        borderRadius: THEME.radius.pill,
        backgroundColor: THEME.colors.surfaceElevated,
        marginTop: moderateScale(10),
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: THEME.radius.pill
    },
    expandText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(8),
        textAlign: 'center',
        marginTop: moderateScale(6),
        lineHeight: moderateScale(11),
        paddingHorizontal: moderateScale(2)
    }
});