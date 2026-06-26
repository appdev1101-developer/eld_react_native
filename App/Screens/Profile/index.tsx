import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Container } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import DashboardService from '../../Services/Dashboard';
import { setConfigData, setUserInfo } from '../../Redux/reducer/User';

const Profile = () => {
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([
            DashboardService.getDashboard(),
            DashboardService.getConfigData()
        ])
            .then(([dashboardData, configData]) => {
                if (dashboardData.status === 'success') {
                    dispatch(setUserInfo(dashboardData.userInfo));
                }
                if (configData.status === 'success') {
                    dispatch(setConfigData(configData));
                }
            })
            .catch((error) => {
                console.log('bookmark refresh error', error);
            })
            .finally(() => setRefreshing(false));
    }, [dispatch]);

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
