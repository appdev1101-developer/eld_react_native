export type NetworkConnectionType =
    | 'wifi'
    | 'cellular'
    | 'ethernet'
    | 'bluetooth'
    | 'wimax'
    | 'vpn'
    | 'other'
    | 'unknown'
    | 'none';

export interface NetworkSnapshot {
    isOnline: boolean;
    isInternetReachable: boolean | null;
    type: NetworkConnectionType;
}

export type NetworkListener = (snapshot: NetworkSnapshot) => void;