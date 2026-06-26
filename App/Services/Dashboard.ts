import { Res } from '../Model/Common';
import { HOSApiDataType } from '../Model/Dashboard';
import HttpClient from '../Utils/HttpClient';
import moment from 'moment-timezone';

async function getHosDetails(): Promise<Res<HOSApiDataType>> {
    return HttpClient.get('dashboard/mobile/data');
}

async function getDashboard(): Promise<Res> {
    return HttpClient.get('dashboard/mobile/data');
}

async function changeHOSStatus(id: number, remark: string): Promise<Res> {
    return HttpClient.get(
        `change/mobile/duty/status/${id}/22.575064/88.042713/${remark}`
    );
}

async function getInspactionData(): Promise<Res> {
    return HttpClient.get(`driver/mobile/inspection/create`);
}

async function getHOSData(fromDate: string, toData: string): Promise<Res> {
    return HttpClient.get(`hos/mobile/data/${toData}/${fromDate}`);
}

async function addInspection(data: any): Promise<Res> {
    return HttpClient.post(`driver/mobile/inspection`, data);
}

async function getInspectionHistory(): Promise<Res> {
    return HttpClient.get(`driver/mobile/inspection`);
}

async function sendMail(mail: string): Promise<Res> {
    return HttpClient.get(`send/mail/${mail}`);
}

async function getConfigData(): Promise<Res> {
    return HttpClient.get(`config/data`);
}

async function getSafetyData(reason: string): Promise<Res> {
    return HttpClient.get(
        `safety/data/${reason}/${moment()
            .tz('America/Denver')
            .format('YYYY-MM-DD')}/${moment().tz('America/Denver').format('YYYY-MM-DD')}`
    );
}

async function getAllNotifications(): Promise<Res> {
    return HttpClient.get(`user/data/notification`);
}

async function getAllUnsignedLog(): Promise<Res> {
    return HttpClient.get(`hos/log/unsigned`);
}

async function readAllNotification(): Promise<Res> {
    return HttpClient.post(`user/data/notification`, {});
}

async function getHOSChartData(date: string): Promise<Res> {
    return HttpClient.get(`hos/mobile/graph/data/${date}`);
}

async function editActivityForm(data: any): Promise<Res> {
    return HttpClient.post(`hos/form/edit/activity`, data);
}

async function getApprovalRequestIndex(): Promise<Res> {
    return HttpClient.get(`approval/mobile/request`);
}

async function changeApprovalRequestStatus(
    approvalRequestType:
        | 'coDriver'
        | 'addLog'
        | 'editLog'
        | 'reassignLog'
        | 'unidentifiedDriving',
    status: number,
    data: any
): Promise<Res> {
    return HttpClient.post(
        `approval/mobile/request/${approvalRequestType}/${status}`,
        data
    );
}

const DashboardService = {
    getHosDetails,
    changeHOSStatus,
    getDashboard,
    getInspactionData,
    getHOSData,
    addInspection,
    getInspectionHistory,
    sendMail,
    getConfigData,
    getSafetyData,
    getAllNotifications,
    getAllUnsignedLog,
    readAllNotification,
    getHOSChartData,
    editActivityForm,
    getApprovalRequestIndex,
    changeApprovalRequestStatus
};

export default DashboardService;
