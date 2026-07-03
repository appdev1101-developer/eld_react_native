import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
    NetworkConnectionType,
    NetworkListener,
    NetworkSnapshot
} from './networkTypes';

let initialized = false;
let currentSnapshot: NetworkSnapshot = {
    isOnline: true,
    isInternetReachable: null,
    type: 'unknown'
};

const listeners = new Set<NetworkListener>();
let unsubscribeNetInfo: (() => void) | null = null;

function mapConnectionType(type: string | undefined): NetworkConnectionType {
    switch (type) {
        case 'wifi':
        case 'cellular':
        case 'ethernet':
        case 'bluetooth':
        case 'wimax':
        case 'vpn':
        case 'other':
        case 'none':
            return type;
        default:
            return 'unknown';
    }
}

function deriveSnapshot(state: NetInfoState): NetworkSnapshot {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;

    const isOnline =
        isConnected &&
        (isInternetReachable === null || isInternetReachable === true);

    return {
        isOnline,
        isInternetReachable,
        type: mapConnectionType(state.type)
    };
}

function notifyListeners(snapshot: NetworkSnapshot): void {
    listeners.forEach((listener) => listener(snapshot));
}

function ensureInitialized(): void {
    if (initialized) {
        return;
    }

    initialized = true;

    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        currentSnapshot = deriveSnapshot(state);
        notifyListeners(currentSnapshot);
    });

    NetInfo.fetch()
        .then((state) => {
            currentSnapshot = deriveSnapshot(state);
            notifyListeners(currentSnapshot);
        })
        .catch(() => {
            currentSnapshot = {
                isOnline: false,
                isInternetReachable: false,
                type: 'unknown'
            };
            notifyListeners(currentSnapshot);
        });
}

export function getIsOnline(): boolean {
    ensureInitialized();
    return currentSnapshot.isOnline;
}

export function getNetworkSnapshot(): NetworkSnapshot {
    ensureInitialized();
    return currentSnapshot;
}

export function subscribeNetwork(listener: NetworkListener): () => void {
    ensureInitialized();
    listeners.add(listener);
    listener(currentSnapshot);

    return () => {
        listeners.delete(listener);
    };
}

export function destroyNetworkMonitor(): void {
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
    listeners.clear();
    initialized = false;
}