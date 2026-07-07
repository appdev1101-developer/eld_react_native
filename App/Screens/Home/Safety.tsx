import { StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import { Container, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import HomeMenuCard from '../../Components/Home/HomeMenuCard';
import NavigationService from '../../Services/Navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { GRADIENT_HEADER } from '../../Constants/Theme';

const Safety = () => {
    const { configData } = useSelector((state: RootState) => state.User);

    const safetyData = useMemo(
        () => configData?.safety_type ?? [],
        [configData?.safety_type]
    );

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Safety</Text>
                    </View>

                    <HomeMenuCard
                        title={`${safetyData.length} Task to review`}
                        listItems={safetyData.map((item: any) => {
                            return {
                                title: item.title,
                                onPress: () =>
                                    NavigationService.navigate('SingleSafety', {
                                        shortName: item.short_name
                                    })
                            };
                        })}
                        footerComponent={
                            <View>
                                <Text
                                    style={{
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(10),
                                        color: '#8E9093',
                                        marginVertical: moderateScale(10)
                                    }}
                                >
                                    We can’t calculate a score because you drove less than
                                    100 miles during the last 4 weeks.
                                </Text>

                                <Text
                                    style={{
                                        color: '#60A5FA',
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(15),
                                        textAlign: 'center',
                                        marginVertical: moderateScale(10)
                                    }}
                                >
                                    Learn About Safety Score
                                </Text>
                            </View>
                        }
                    />
                </View>
            </LinearGradient>
        </Container>
    );
};

export default Safety;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
    },
    header: {
        height: moderateScale(35),
        marginHorizontal: moderateScale(15)
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17)
    },
    mainCard: {
        backgroundColor: '#EFEFEF',
        marginHorizontal: moderateScale(5),
        borderRadius: moderateScale(5)
    }
});