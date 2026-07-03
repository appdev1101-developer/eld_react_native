import React, { createContext, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../core/hooks/useNetworkStatus';
import { NetworkSnapshot } from '../../core/network/networkTypes';
import OfflineBanner from './OfflineBanner';

const NetworkContext = createContext<NetworkSnapshot>({
    isOnline: true,
    isInternetReachable: null,
    type: 'unknown'
});

export function useNetworkContext(): NetworkSnapshot {
    return useContext(NetworkContext);
}

type Props = {
    children: React.ReactNode;
};

const NetworkProvider = ({ children }: Props) => {
    const snapshot = useNetworkStatus();

    return (
        <NetworkContext.Provider value={snapshot}>
            <View style={styles.root}>
                <OfflineBanner />
                {children}
            </View>
        </NetworkContext.Provider>
    );
};

export default NetworkProvider;

const styles = StyleSheet.create({
    root: {
        flex: 1
    }
});