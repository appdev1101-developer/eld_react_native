import { Login } from '../Model/User';
import HttpClient from '../Utils/HttpClient';
import Storage from '../Utils/Storage';

const getAccount = async () => {
    return Storage.get('account');
};

async function setAccount(data: any) {
    return await Storage.set('account', data);
}

async function setToken(data: string) {
    return await Storage.set('token', data);
}

async function getToken() {
    return await Storage.get('token');
}

async function login(data: Login) {
    let endpoint = 'user/mobile/login';
    return HttpClient.post(endpoint, data);
}

async function forgotPass(email: string) {
    let endpoint = `forgot/mobile/password/${email}`;
    return HttpClient.post(endpoint, {});
}

async function changePassword(email: string, pass: string, confirmPass: string) {
    let endpoint = `reset/mobile/password/${email}`;
    return HttpClient.multiupload(endpoint, 'POST', [], {
        password: pass,
        confirm_password: confirmPass
    });
}

function logout() {
    Storage.clear();
}

const AuthService = {
    getAccount,
    setAccount,
    setToken,
    login,
    logout,
    forgotPass,
    changePassword,
    getToken
};

export default AuthService;
