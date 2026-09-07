import { API } from '../endpoints';
import { apiClient, apiPost, apiUploadMultipart } from '../client';
import { isSuccess } from '../types/common';
import { requireOnline } from '../../network/requireOnline';
import { getApiErrorMessage } from '../../../Utils/apiErrorMessage';
import { clearDiagnosticLogFile, DIAGNOSTIC_LOG_FILE_NAME, getDiagnosticLogFilePath, readDiagnosticLogFile } from '../../logger/file_logger';
import RNFS from 'react-native-fs';
import Storage from '../../../Utils/Storage';
import { logger } from '../../logger';


export type UploadDiagnosticLogsResult = {
    success: boolean;
    message?: string;
    /** True when there was simply no log file/content to send — not an error. */
    empty?: boolean;
};

/**
 * Uploads the combined JS + native diagnostic log file (see
 * core/logger/fileLogger.ts and android's FileLogger.kt) to the backend,
 * then clears the local file on success so the next export starts fresh
 * rather than re-sending everything already submitted.
 */
export async function uploadDiagnosticLogs(): Promise<UploadDiagnosticLogsResult> {
    const content = await readDiagnosticLogFile();
    if (!content || content.trim().length === 0) {
        return { success: false, empty: true };
    }

    if (!requireOnline()) {
        return { success: false, message: 'No internet connection.' };
    }
    // const filePath = getDiagnosticLogFilePath();
    // const formData = new FormData();

    // formData.append('device_platform', 'android');

    // formData.append('log_file', {
    //     uri: `file://${filePath}`,
    //     type: 'text/plain',
    //     name: DIAGNOSTIC_LOG_FILE_NAME,
    // } as any);

    // console.log('Sending direct multipart request...');

    // try {
    //     const response = await apiClient.post(
    //         API.diagnostics.uploadLogs(),
    //         formData,
    //         {
    //             headers: {
    //                 Accept: 'application/json',
    //             },
    //         }
    //     );

    //     console.log('UPLOAD SUCCESS');
    //     console.log('status:', response.status);
    //     console.log('data:', response.data);
    // } catch (error: any) {
    //     console.log('UPLOAD FAILED');
    //     console.log('message:', error?.message);
    //     console.log('code:', error?.code);
    //     console.log('response:', error?.response?.data);
    //     console.log('status:', error?.response?.status);
    //     console.log('request:', error?.request);
    // }
    // const token = await Storage.get<string>('token');
    // try {
    //     const response = await fetch(
    //         `https://uat.apnatelelink.us${API.diagnostics.uploadLogs()}`,
    //         {
    //             method: 'POST',
    //             headers: {
    //                 Accept: 'application/json',
    //                 Authorization: `Bearer ${token}`,
    //             },
    //             body: formData,
    //         }
    //     );

    //     console.log('HTTP status:', response.status);

    //     const text = await response.text();

    //     console.log('Server response:', text);
    // } catch (error) {
    //     console.error('FETCH UPLOAD FAILED:', error);
    // }

    // return { success: true, message: "message" };

    try {
        const filePath = getDiagnosticLogFilePath();
        const fileName = DIAGNOSTIC_LOG_FILE_NAME;
        const exists = await RNFS.exists(filePath);

        logger.log("<<<<<< [Diagnostic Upload] >>>>>>>");
        logger.log(`<<<<<< [filePath] >>>>>>> ${filePath} >>> ${fileName}`);
        logger.log(`<<<<<< [File exists] >>>>>>> ${exists}`);

        if (exists) {
            const stat = await RNFS.stat(filePath);
            logger.log(`<<<<<< [file type] [size]>>>>>>> ${stat.isFile} >>> ${stat.size}`);
            
            const content = await RNFS.readFile(filePath, 'utf8');
            logger.log(`<<<<<< ['File length:'] >>>>>>> ${content.length}`);
            
        }
        const payload={
            device_platform: 'android',
            log_file: content,
        };
        const result = await apiPost(
            API.diagnostics.uploadLogs(),
            (raw) => raw,
            payload
        );
        
        if (isSuccess(result)) {
            await clearDiagnosticLogFile();
            return { success: true, message: result.message };
        }

        return { success: false, message: result.message };
    } catch (error) {
        return {
            success: false,
            message: getApiErrorMessage(error, 'Failed to upload diagnostic logs')
        };
    }
}