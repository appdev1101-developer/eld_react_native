import {
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import {
    AppButton,
    AppTextInput,
    Container,
    Text,
    useTheme
} from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import BackHeader from '../../Components/Headers/BackHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { getUserAvatarSource } from '../../Constants/ProfileImage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { setUser, setUserInfo } from '../../Redux/reducer/User';
import { useSession } from '../../core/hooks/useSession';
import { settingsApi } from '../../core/api/services/settingsApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { useDashboard } from '../../core/hooks/useDashboard';
import { UserDataType } from '../../Model/User';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { email as validateEmail, firstInvalid, required } from '../../Utils/validators';

const SETTING_ITEMS: Array<{
    title: string;
    image: ImageSourcePropType;
    onPress?: () => void;
}> = [
    {
        title: 'Notification and Sounds',
        image: require('../../Assets/Icons/Union.png')
    },
    {
        title: 'Privacy and Security',
        image: require('../../Assets/Icons/privacy.png')
    },
    {
        title: 'Chat settings',
        image: require('../../Assets/Icons/Chat.png')
    },
    {
        title: 'Devices',
        image: require('../../Assets/Icons/Device.png')
    }
];

type AccountSettingProps = {
    headerTitle?: string;
    showBack?: boolean;
};

const AccountSetting = ({
    headerTitle: headerTitleProp,
    showBack: showBackProp
}: AccountSettingProps = {}) => {
    const route = useRoute<any>();
    const dispatch = useDispatch();
    const { updateAccount: persistAccount } = useSession();
    const { userData, userInfo, configData } = useSelector(
        (state: RootState) => state.User
    );
    const colors = useTheme();
    const headerTitle =
        headerTitleProp ?? route.params?.headerTitle ?? 'Account Settings';
    const showBack = showBackProp ?? route.params?.showBack ?? true;

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [username, setUsername] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [timezone, setTimezone] = useState('');
    const [languageId, setLanguageId] = useState('1');
    const [saving, setSaving] = useState(false);
    const { refresh, refreshing } = useDashboard();

    const onRefresh = useCallback(() => {
        refresh().catch((error) => {
            console.log('profile refresh error', error);
        });
    }, [refresh]);

    useEffect(() => {
        if (!userData) {
            return;
        }

        setFirstName(userData.first_name ?? '');
        setLastName(userData.last_name ?? '');
        setEmail(userData.email ?? '');
        setPhone(userData.mobile_no ?? '');
        setPincode(userData.pin_code ?? '');
        setAddress(userData.address ?? '');
        setTimezone(
            userData.timezone ??
                userInfo?.home_terminal_timezone ??
                configData?.timezone ??
                ''
        );
        setLanguageId(
            String(userInfo?.language_id ?? userData.language_id ?? '1')
        );
        setUsername(userInfo?.username ?? userData.username ?? '');
        setLicenseNumber(userInfo?.licenseNumber ?? '');
    }, [userData, userInfo, configData]);

    const languageLabel =
        configData?.lang_data?.find(
            (lang) => String(lang.id) === String(languageId)
        )?.language_name ?? 'English';

    const handleUpdateProfile = () => {
        const validation = firstInvalid(
            required(firstName, 'First name'),
            required(lastName, 'Last name'),
            validateEmail(email)
        );

        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        const driverId = String(userInfo?.driver_id ?? userData?.driver_id ?? '');

        if (!driverId) {
            showError('Driver ID is missing');
            return;
        }

        if (!requireOnline()) {
            return;
        }

        setSaving(true);

        settingsApi.updateAccountLegacy({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            driver_id: driverId,
            email: email.trim(),
            phone: phone.trim(),
            language_id: languageId.trim() || '1',
            pincode: pincode.trim(),
            address: address.trim(),
            timezone: timezone.trim(),
            username: username.trim(),
            licenseNumber: licenseNumber.trim()
        })
            .then(async (result) => {
                if (isLegacySuccess(result)) {
                    const updatedUser: UserDataType = {
                        ...(userData as UserDataType),
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        email: email.trim(),
                        mobile_no: phone.trim(),
                        pin_code: pincode.trim(),
                        address: address.trim(),
                        timezone: timezone.trim(),
                        language_id: languageId.trim() || '1',
                        username: username.trim()
                    };

                    dispatch(setUser(updatedUser));
                    if (userInfo) {
                        dispatch(
                            setUserInfo({
                                ...userInfo,
                                licenseNumber: licenseNumber.trim(),
                                username: username.trim(),
                                language_id: Number(languageId) || null,
                                home_terminal_timezone: timezone.trim()
                            })
                        );
                    }
                    await persistAccount(updatedUser);

                    showToast(result.message || 'Profile updated successfully');
                } else {
                    showError(result?.message || 'Failed to update profile');
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to update profile'));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    return (
        <Container>
            <AppStatusBar />
            <BackHeader title={headerTitle} showBack={showBack} />

            <ScrollView
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                            refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#392969']}
                        tintColor="#392969"
                    />
                }
            >
                <View style={styles.profileContainer}>
                    <Image
                        source={getUserAvatarSource(userData?.avatar_image)}
                        style={{
                            height: moderateScale(65),
                            width: moderateScale(65),
                            borderRadius: moderateScale(65 / 2)
                        }}
                        resizeMode="cover"
                    />

                    <Text
                        style={{
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(20),
                            width: '50%',
                            marginLeft: moderateScale(13),
                            color: colors.buttonColor
                        }}
                    >
                        {`${firstName} ${lastName}`.trim() || 'Profile'}
                    </Text>
                </View>

                <View
                    style={{
                        marginHorizontal: moderateScale(10)
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FONTS.ProductSans.bold,
                            fontSize: moderateScale(15)
                        }}
                    >
                        Personal Information
                    </Text>

                    <AppTextInput.Outlined
                        placeholder="First Name"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={firstName}
                        onChangeText={setFirstName}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Last Name"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={lastName}
                        onChangeText={setLastName}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Email Address"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Phone Number"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Username"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="License"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Address"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={address}
                        onChangeText={setAddress}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Pincode"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={pincode}
                        onChangeText={setPincode}
                        keyboardType="number-pad"
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Timezone"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={timezone}
                        onChangeText={setTimezone}
                        autoCapitalize="none"
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Language"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={languageLabel}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Driver ID"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={userInfo?.driver_id ?? ''}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Carrier"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={userInfo?.career_name ?? ''}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Main Office Address"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={String(userInfo?.main_office_address ?? '')}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Home Terminal Name"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={userInfo?.home_terminal_name ?? ''}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <AppTextInput.Outlined
                        placeholder="Home Terminal Address"
                        containerStyle={styles.inputContainerStyle}
                        activeBorderColor={'#848484'}
                        value={userInfo?.home_terminal?.address ?? ''}
                        editable={false}
                        inputStyle={{
                            ...styles.inputStyle,
                            color: colors.primaryFontFamily
                        }}
                    />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginVertical: moderateScale(15)
                        }}
                    >
                        <Image
                            source={require('../../Assets/Icons/warning.png')}
                            style={{
                                height: moderateScale(18),
                                width: moderateScale(18),
                                resizeMode: 'contain',
                                tintColor: '#848484'
                            }}
                        />
                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.regular,
                                color: '#848484',
                                fontSize: moderateScale(12),
                                marginLeft: moderateScale(10),
                                width: '90%'
                            }}
                        >
                            Carrier and terminal details are managed by your fleet
                            manager.
                        </Text>
                    </View>

                    <AppButton
                        title={saving ? 'Updating...' : 'Update Profile'}
                        disabled={saving}
                        textStyle={styles.btnTextStyle}
                        style={styles.updateButton}
                        onPress={handleUpdateProfile}
                        loader={saving ? {
                            position: 'right',
                            size: 'small',
                            color: '#FFFFFF'
                        } : undefined}
                    />

                    <View
                        style={{
                            marginTop: moderateScale(30)
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.bold,
                                fontSize: moderateScale(17),
                                color: colors.buttonColor
                            }}
                        >
                            Settings
                        </Text>
                        {SETTING_ITEMS.map((item, index) => {
                            return (
                                <View
                                    style={styles.settingListItem}
                                    key={index}
                                >
                                    <Image
                                        source={item.image}
                                        style={{
                                            height: moderateScale(18),
                                            width: moderateScale(18),
                                            resizeMode: 'contain',
                                            tintColor: colors.buttonColor
                                        }}
                                    />

                                    <Text
                                        style={{
                                            color: colors.buttonColor,
                                            fontFamily: FONTS.ProductSans.regular,
                                            fontSize: moderateScale(15),
                                            marginLeft: moderateScale(15)
                                        }}
                                    >
                                        {item.title}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <Text
                        style={{
                            fontFamily: FONTS.ProductSans.regular,
                            color: '#848484',
                            fontSize: moderateScale(11),
                            textDecorationLine: 'underline',
                            textAlign: 'center',
                            marginVertical: moderateScale(10)
                        }}
                    >
                        Report a bug
                    </Text>
                </View>
            </ScrollView>
        </Container>
    );
};

export default AccountSetting;

const styles = StyleSheet.create({
    profileContainer: {
        paddingVertical: moderateScale(10),
        marginHorizontal: moderateScale(10),
        borderRadius: moderateScale(20),
        marginBottom: moderateScale(15),
        flexDirection: 'row',
        alignItems: 'center'
    },
    inputContainerStyle: {
        borderColor: '#F6F6F6',
        marginTop: moderateScale(20)
    },
    inputStyle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13)
    },
    updateButton: {
        height: moderateScale(42),
        marginTop: moderateScale(5)
    },
    btnTextStyle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14),
        color: '#FFFFFF'
    },
    settingListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: moderateScale(55)
    }
});
