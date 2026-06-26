import { NativeModules, Platform } from 'react-native';

const { GeometrisBridge } = NativeModules;

// Bluetooth Device Type
export type BluetoothDevice = {
    name: string;
    address: string;
};

// Unidentified Event Type (from GeoData)
export type UnidentifiedEvent = {
    timestamp?: number;
    reason?: number;
    engineHours?: number;
    speed?: number;
    odometer?: number;
    latitude?: number;
    longitude?: number;
    gpsTimestamp?: number;
};

// GeoData Type (from your native bridge)
export type GeoData = {
    // Basic status
    dataSet: boolean;
    protocolId?: number;
    
    // Vehicle identification
    vin: string;
    
    // Odometer
    odometer: number;
    odometerTimestamp: string;
    
    // Engine hours
    engineHours: number;
    engineHoursTimestamp: string;
    
    // Speed
    speed: number;
    speedTimestamp: string;
    
    // Engine RPM
    engineRpm: number;
    engineRpmTimestamp: string;
    
    // Fuel level
    fuelLevel: number;
    fuelLevelTimestamp: string;
    
    // Additional OBD parameters (Protocol 1+)
    coolantTemp?: number;
    coolantTempTimestamp?: string;
    ecuVoltage?: number;
    ecuVoltageTimestamp?: string;
    throttlePos?: number;
    throttlePosTimestamp?: string;
    ambientTemp?: number;
    ambientTempTimestamp?: string;
    
    // MPG data
    obdMpg?: number;
    obdTripMpg?: number;
    obdInstantMpg?: number;
    
    // Diagnostics
    milStatus?: boolean;
    dtcCount?: number;
    regenSwitchStatus?: boolean;
    
    // GPS location
    latitude: number;
    longitude: number;
    gpsHeading: number;
    gpsTime?: number;
    
    // General timestamp
    timestamp: string;
    
    // Unidentified driving events
    totalUdrvEvents?: number;
    unidentifiedEvents?: UnidentifiedEvent[];
};

// Helper module
const Geometris = {
    /**
     * Scan for nearby Bluetooth devices
     */
    async findBluetoothDevices(): Promise<BluetoothDevice[]> {
        return GeometrisBridge.findBluetoothDevices() as Promise<BluetoothDevice[]>;
    },

    /**
     * Stop the current Bluetooth scan (optional)
     */
    async stopBluetoothScan(): Promise<void> {
        if (GeometrisBridge.stopBluetoothScan) {
            return GeometrisBridge.stopBluetoothScan() as Promise<void>;
        }
        return Promise.resolve();
    },

    /**
     * Connect to a device by address
     */
    async connectToDevice(address: string): Promise<boolean> {
        return GeometrisBridge.connectToDevice(address) as Promise<boolean>;
    },

    /**
     * Start OBD data session
     */
    async startSession(): Promise<boolean> {
        return GeometrisBridge.startSession() as Promise<boolean>;
    },

    /**
     * Disconnect from the device/session
     */
    async disconnect(): Promise<boolean> {
        return GeometrisBridge.disconnect() as Promise<boolean>;
    }
};

export default Geometris;
