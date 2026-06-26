import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { GROUP_INFO } from '../../Constants/MessageMockData';

type GroupMediaParams = {
    GroupMedia: {
        chatId: string;
    };
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = moderateScale(4);
const IMAGE_SIZE =
    (width - moderateScale(40) - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const GroupMedia = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<GroupMediaParams, 'GroupMedia'>>();
    const { chatId } = route.params;
    const group = GROUP_INFO[chatId as keyof typeof GROUP_INFO];
    const media = group?.media ?? [];

    return (
        <Container>
            <AppStatusBar />
            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { marginTop: insets.top }]}>
                    <Pressable
                        onPress={() => NavigationService.back()}
                        hitSlop={10}
                    >
                        <Icon
                            name="chevron-left"
                            type="Feather"
                            size={moderateScale(22)}
                            color="#fff"
                        />
                    </Pressable>
                    <Text style={styles.headerTitle}>Media</Text>
                    <View style={{ width: moderateScale(22) }} />
                </View>

                <View style={styles.bodyCard}>
                    <FlatList
                        data={media}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        numColumns={COLUMN_COUNT}
                        columnWrapperStyle={styles.gridRow}
                        contentContainerStyle={styles.grid}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.mediaImage}
                            />
                        )}
                    />
                </View>
            </LinearGradient>
        </Container>
    );
};

export default GroupMedia;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: moderateScale(15),
        marginBottom: moderateScale(10)
    },
    headerTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: '#fff'
    },
    bodyCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: moderateScale(30),
        borderTopRightRadius: moderateScale(30),
        paddingTop: moderateScale(15)
    },
    grid: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(20)
    },
    gridRow: {
        gap: GAP,
        marginBottom: GAP
    },
    mediaImage: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: moderateScale(6)
    }
});
