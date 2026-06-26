import { Res } from '../Model/Common';
import HttpClient from '../Utils/HttpClient';

export type UpdateAccountPayload = {
    first_name: string;
    last_name: string;
    driver_id: string;
    email: string;
    phone: string;
    language_id: string;
    pincode: string;
    address: string;
    timezone: string;
    username: string;
    licenseNumber: string;
};

async function updateAccount(data: UpdateAccountPayload): Promise<Res> {
    return HttpClient.multiupload('setting/mobile/account/edit', 'POST', [], data);
}

const SettingsService = {
    updateAccount
};

export default SettingsService;
