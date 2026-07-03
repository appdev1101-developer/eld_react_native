import { createSlice } from '@reduxjs/toolkit';
import { UserDataType, UserInfoDataType } from '../../Model/User';
import { ConfigResponse } from '../../Model/Dashboard';

interface UserReduxDataType {
    loginStatus: boolean;
    userData: UserDataType | null;
    userInfo: UserInfoDataType | null;
    configData: ConfigResponse | null;
}

const initialState: UserReduxDataType = {
    userData: null,
    loginStatus: false,
    userInfo: null,
    configData: null
};

export const UserSlice = createSlice({
    name: 'user',
    initialState: initialState,
    reducers: {
        setUser(state, action) {
            state.userData = action.payload;
            state.loginStatus = true;
        },
        setUserInfo(state, action) {
            state.userInfo = action.payload;
        },
        setConfigData(state, action) {
            state.configData = action.payload;
        },
        logout(state) {
            state.userData = null;
            state.loginStatus = false;
            state.userInfo = null;
            state.configData = null;
        }
    }
});

export const { setUser, logout, setUserInfo, setConfigData } = UserSlice.actions;

export default UserSlice.reducer;