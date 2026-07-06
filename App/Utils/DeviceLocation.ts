import { NativeModules, Platform } from 'react-native';

type DeviceLocationResult = {
    latitude: number;
    longitude: number;
    address: string;
};

const { DeviceLocation: NativeDeviceLocation } = NativeModules;

const DeviceLocation = {
    async getCurrentLocation(): Promise<DeviceLocationResult | null> {
        if (Platform.OS !== 'android' || !NativeDeviceLocation?.getCurrentLocation) {
            return null;
        }

        try {
            const result = (await NativeDeviceLocation.getCurrentLocation()) as DeviceLocationResult;
            if (
                typeof result?.latitude !== 'number' ||
                typeof result?.longitude !== 'number' ||
                Number.isNaN(result.latitude) ||
                Number.isNaN(result.longitude)
            ) {
                return null;
            }
            return result;
        } catch {
            return null;
        }
    },

    async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        if (Platform.OS !== 'android' || !NativeDeviceLocation?.reverseGeocode) {
            return null;
        }

        try {
            const address = (await NativeDeviceLocation.reverseGeocode(lat, lng)) as string;
            const trimmed = address?.trim();
            return trimmed || null;
        } catch {
            return null;
        }
    }
};

export default DeviceLocation;