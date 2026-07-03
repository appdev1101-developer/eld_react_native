import { useEffect, useState } from 'react';
import { subscribeNetwork } from '../network/networkMonitor';
import { NetworkSnapshot } from '../network/networkTypes';

export function useNetworkStatus(): NetworkSnapshot {
    const [snapshot, setSnapshot] = useState<NetworkSnapshot>(() => ({
        isOnline: true,
        isInternetReachable: null,
        type: 'unknown'
    }));

    useEffect(() => subscribeNetwork(setSnapshot), []);

    return snapshot;
}