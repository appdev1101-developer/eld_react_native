import {
    StyleSheet,
    View,
    Modal,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import React, { useState, useEffect } from 'react';
import {
    AppButton,
    AppTextInput,
    Card,
    Container,
    Icon,
    Text
} from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import Geometris, { BluetoothDevice } from '../../Utils/Geometris';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import {
    ensureEldPermissions,
    formatDeniedPermissionsMessage,
    openAppSettings,
    openDeviceLocationSettings
} from '../../Utils/EldPermissions';
import AppStatusBar from '../../Components/AppStatusBar';

const ITEMS: Array<string> = [
    'Ensure the ELD MAC address is entered correctly.',
    'Confirm the ELD hardware is properly installed.',
    'Make sure the vehicle power is turned on.',
    'Ensure Bluetooth is enabled on the mobile device.',
    'Ensure GPS is enabled on the mobile device.'
];

const ConnectELD = () => {
    const [macAddress, setMacAddress] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [scanning, setScanning] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const requirePermissions = async (): Promise<boolean> => {
        const status = await ensureEldPermissions();
        if (status.allGranted) {
            return true;
        }

        if (!status.deviceLocationEnabled) {
            Alert.alert(
                'Turn on Location (GPS)',
                'Truxy needs your phone Location/GPS enabled. The grey location icon in your status bar means device GPS is off.',
                [
                    { text: 'Not now', style: 'cancel' },
                    {
                        text: 'Open Location Settings',
                        onPress: openDeviceLocationSettings
                    }
                ]
            );
            return false;
        }

        Alert.alert(
            'Permissions required',
            `${formatDeniedPermissionsMessage(status)} Enable them in app Settings.`,
            [
                { text: 'Not now', style: 'cancel' },
                { text: 'Open App Settings', onPress: openAppSettings }
            ]
        );
        return false;
    };

    // Function to scan for Bluetooth devices
    const scanForDevices = async () => {
        try {
            setDevices([]);
            setConnectionError('');
            setScanning(true);

            const granted = await requirePermissions();
            if (!granted) {
                const errorMessage =
                    'Location, Bluetooth, and notification permissions are required';
                setConnectionError(errorMessage);
                setScanning(false);
                return;
            }

            try {
                const foundDevices = await Geometris.findBluetoothDevices();
                setDevices(foundDevices);
            } catch (error) {
                const errorMessage = 'Failed to scan for Bluetooth devices';
                setConnectionError(errorMessage);
                Alert.alert('Scan Error', errorMessage);
            } finally {
                setScanning(false);
            }
        } catch (error) {
            console.error('Failed to scan for devices:', error);
            const errorMessage = 'Failed to scan for Bluetooth devices';
            setConnectionError(errorMessage);
            Alert.alert('Scan Error', errorMessage);
        } finally {
            setScanning(false);
        }
    };

    // Function to handle device selection from scan modal
    const selectDevice = async (device: BluetoothDevice) => {
        try {
            setConnecting(true);
            setConnectionError('');

            if (!(await requirePermissions())) {
                setConnecting(false);
                return;
            }

            const started = await GeoDataBackgroundService.start(device.address);
            if (started) {
                setMacAddress(device.address);
                setModalVisible(false);
                Alert.alert(
                    'Success',
                    `Connected to ${device.name || 'device'} successfully!`,
                    [
                        {
                            text: 'OK',
                            onPress: () => NavigationService.navigate('BottomTab')
                        }
                    ]
                );
            } else {
                const errorMessage = 'Failed to start ELD data service';
                setConnectionError(errorMessage);
                Alert.alert('Connection Failed', errorMessage);
            }
        } catch (error) {
            console.error('Error connecting to device:', error);
            const errorMessage = 'Error connecting to device';
            setConnectionError(errorMessage);
            Alert.alert('Connection Error', errorMessage);
        } finally {
            setConnecting(false);
        }
    };

    // Clean up on unmount — only stop BT scan; do NOT disconnect the background service
    useEffect(() => {
        return () => {
            Geometris.stopBluetoothScan();
        };
    }, []);

    // Render device item
    const renderDevice = ({ item }: { item: BluetoothDevice }) => (
        <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => selectDevice(item)}
            disabled={connecting}
        >
            <Icon
                name="bluetooth"
                type="FontAwesome"
                size={moderateScale(20)}
                color="#392969"
                style={styles.deviceIcon}
            />
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
                <Text style={styles.deviceAddress}>{item.address}</Text>
            </View>
            <Icon
                name="chevron-right"
                type="Feather"
                size={moderateScale(20)}
                color="#7051CF"
            />
        </TouchableOpacity>
    );

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyContainer}>
                        <Text style={styles.heading}>Connect ELD</Text>
                        <Text style={styles.macAddressText}>
                            Enter the ELD MAC address to connect
                        </Text>

                        <Text
                            style={[
                                styles.itemText,
                                {
                                    marginTop: moderateScale(10)
                                }
                            ]}
                        >
                            Please verify the following items:
                        </Text>

                        {ITEMS.map((item, index) => {
                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                    key={index}
                                >
                                    <View style={styles.dot} />

                                    <Text style={styles.itemText}>{item}</Text>
                                </View>
                            );
                        })}

                        <Card style={styles.cardStyle}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginHorizontal: moderateScale(17)
                                }}
                            >
                                <Icon
                                    name="clock"
                                    type="Feather"
                                    size={moderateScale(20)}
                                    style={{
                                        marginTop: moderateScale(5)
                                    }}
                                    color={'#392969'}
                                />

                                <Text
                                    style={{
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(15),
                                        marginLeft: moderateScale(10),
                                        marginRight: moderateScale(20)
                                    }}
                                >
                                    Enter ELD MAC address listed on this device.
                                </Text>
                            </View>

                            <AppTextInput
                                placeholder="ELD MAC Address"
                                placeholderTextColor="#697D95"
                                inputContainerStyle={{
                                    backgroundColor: '#E8EDF1',
                                    paddingHorizontal: moderateScale(10),
                                    marginHorizontal: moderateScale(17),
                                    marginTop: moderateScale(10)
                                }}
                                inputStyle={{
                                    fontSize: moderateScale(12)
                                }}
                                value={macAddress}
                                onChangeText={setMacAddress}
                            />

                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={() => {
                                    setModalVisible(true);
                                    scanForDevices();
                                }}
                            >
                                <Icon
                                    name="bluetooth-searching"
                                    type="MaterialIcon"
                                    size={moderateScale(18)}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.scanButtonText}>
                                    Scan for devices
                                </Text>
                            </TouchableOpacity>
                        </Card>

                        <AppButton
                            title="Connect Now"
                            buttonIcon={{
                                position: 'right',
                                name: 'chevron-right',
                                type: 'Feather',
                                color: '#FFFFFF'
                            }}
                            textStyle={styles.btnText}
                            style={styles.btn}
                            onPress={async () => {
                                if (macAddress) {
                                    try {
                                        setConnecting(true);
                                        if (!(await requirePermissions())) {
                                            setConnecting(false);
                                            return;
                                        }
                                        const started =
                                            await GeoDataBackgroundService.start(
                                                macAddress
                                            );
                                        if (started) {
                                            Alert.alert(
                                                'Success',
                                                'Connected to ELD device successfully!',
                                                [
                                                    {
                                                        text: 'OK',
                                                        onPress: () =>
                                                            NavigationService.navigate(
                                                                'BottomTab'
                                                            )
                                                    }
                                                ]
                                            );
                                        } else {
                                            Alert.alert(
                                                'Connection Failed',
                                                'Failed to connect to the device. Please check the MAC address and try again.'
                                            );
                                        }
                                    } catch (error) {
                                        console.error('Error connecting:', error);
                                        Alert.alert(
                                            'Connection Error',
                                            'Error connecting to device. Please try again.'
                                        );
                                    } finally {
                                        setConnecting(false);
                                    }
                                } else {
                                    Alert.alert(
                                        'Missing Information',
                                        'Please enter MAC address or select a device'
                                    );
                                }
                            }}
                            disabled={connecting || !macAddress}
                        />

                        <AppButton
                            title="Skip"
                            textStyle={styles.btnText}
                            style={{ ...styles.btn, ...styles.skipButton }}
                            onPress={() => NavigationService.navigate('BottomTab')}
                            disabled={connecting}
                        />

                        {connecting && (
                            <ActivityIndicator
                                size="large"
                                color="#FFFFFF"
                                style={styles.loadingIndicator}
                            />
                        )}
                </View>
            </LinearGradient>

            {/* Bluetooth Devices Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    Geometris.stopBluetoothScan();
                    setModalVisible(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Bluetooth Device</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Geometris.stopBluetoothScan();
                                    setModalVisible(false);
                                }}
                            >
                                <Icon
                                    name="x"
                                    type="Feather"
                                    size={moderateScale(24)}
                                    color="#392969"
                                />
                            </TouchableOpacity>
                        </View>

                        {scanning && (
                            <View style={styles.scanningContainer}>
                                <ActivityIndicator
                                    size="large"
                                    color="#392969"
                                />
                                <Text style={styles.scanningText}>
                                    Scanning for devices...
                                </Text>
                            </View>
                        )}

                        {!scanning && devices.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Icon
                                    name="bluetooth-disabled"
                                    type="MaterialIcon"
                                    size={moderateScale(40)}
                                    color="#7051CF"
                                    style={{ marginBottom: moderateScale(10) }}
                                />
                                <Text style={styles.emptyText}>No devices found</Text>
                            </View>
                        )}

                        {connectionError ? (
                            <Text style={styles.errorText}>{connectionError}</Text>
                        ) : null}

                        <FlatList
                            data={devices}
                            renderItem={renderDevice}
                            keyExtractor={(item) => item.address}
                            style={styles.deviceList}
                            contentContainerStyle={{ flexGrow: 1 }}
                        />

                        <View style={styles.modalFooter}>
                            <AppButton
                                title={scanning ? 'Stop Scan' : 'Rescan'}
                                style={styles.rescanButton}
                                textStyle={styles.rescanButtonText}
                                onPress={
                                    scanning
                                        ? async () => {
                                              await Geometris.stopBluetoothScan();
                                              setScanning(false);
                                          }
                                        : scanForDevices
                                }
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </Container>
    );
};

export default ConnectELD;

const styles = StyleSheet.create({
    bodyContainer: {
        marginHorizontal: moderateScale(15),
        marginTop: moderateScale(40)
    },
    heading: {
        fontSize: moderateScale(25),
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.regular
    },
    macAddressText: {
        fontSize: moderateScale(19),
        fontFamily: FONTS.ProductSans.regular,
        fontStyle: 'italic',
        color: '#FF8461'
    },
    itemText: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.regular,
        lineHeight: moderateScale(18)
    },
    dot: {
        height: moderateScale(4),
        width: moderateScale(4),
        borderRadius: moderateScale(2),
        backgroundColor: '#FFFFFF',
        marginLeft: moderateScale(7),
        marginRight: moderateScale(10)
    },
    cardStyle: {
        marginVertical: moderateScale(23),
        marginHorizontal: moderateScale(6),
        paddingTop: moderateScale(10),
        paddingBottom: moderateScale(25),
        borderRadius: moderateScale(17)
    },
    btnText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#FFFFFF'
    },
    btn: {
        alignSelf: 'center',
        paddingHorizontal: moderateScale(18),
        backgroundColor: '#4ECB71'
    },
    skipButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        marginTop: moderateScale(16)
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7051CF',
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(12),
        borderRadius: moderateScale(8),
        marginHorizontal: moderateScale(17),
        marginTop: moderateScale(15)
    },
    scanButtonText: {
        color: '#FFFFFF',
        marginLeft: moderateScale(8),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    },
    loadingIndicator: {
        marginTop: moderateScale(15)
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20)
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: moderateScale(20),
        padding: moderateScale(20),
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(20)
    },
    modalTitle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18),
        color: '#392969',
        fontWeight: 'bold'
    },
    deviceList: {
        maxHeight: '70%'
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(15),
        borderBottomWidth: 1,
        borderBottomColor: '#E8EDF1'
    },
    deviceIcon: {
        marginRight: moderateScale(15)
    },
    deviceInfo: {
        flex: 1
    },
    deviceName: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(16),
        color: '#392969'
    },
    deviceAddress: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#697D95'
    },
    scanningContainer: {
        alignItems: 'center',
        padding: moderateScale(20)
    },
    scanningText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(16),
        color: '#392969',
        marginTop: moderateScale(10)
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: moderateScale(30)
    },
    emptyText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(16),
        color: '#697D95'
    },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
        margin: moderateScale(10),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    },
    modalFooter: {
        marginTop: moderateScale(20)
    },
    rescanButton: {
        backgroundColor: '#7051CF'
    },
    rescanButtonText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#FFFFFF'
    }
});
