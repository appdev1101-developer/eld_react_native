import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import React, { useCallback } from 'react';
import { Container } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { useDashboard } from '../../core/hooks/useDashboard';

const Profile = () => {
    const { refresh, refreshing } = useDashboard();

    const onRefresh = useCallback(() => {
        refresh().catch((error) => {
            console.log('profile refresh error', error);
        });
    }, [refresh]);

    return (
        <Container>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#392969']}
                        tintColor="#392969"
                    />
                }
            >
                <View style={{ height: moderateScale(30) }} />
            </ScrollView>
        </Container>
    );
};

export default Profile;

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1
    }
});