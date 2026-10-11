import moment from 'moment';
import { HosGraphLogEntry } from '../types/hosLog';
import { EditDutyStatusFormValues } from '../types/editDutyStatus';
import { requireOnline } from '../../network/requireOnline';
import { apiPost } from '../client';
import { API } from '../endpoints';
import { ApiResponse, isSuccess } from '../types/common';
import { getApiErrorMessage } from '../../../Utils/apiErrorMessage';
// import { API } from '../../../core/api/endpoints';
// import { apiPost } from '../../../core/api/client';
// import { isSuccess } from '../../../core/api/types/common';
// import { requireOnline } from '../../../core/network/requireOnline';
// import { getApiErrorMessage } from '../../../Utils/apiErrorMessage';
// import { HosGraphLogEntry } from '../../../core/api/types/hosLog';
// import { EditDutyStatusFormValues } from '../types/editDutyStatus.types';
import { logger } from '../../logger/index';

export async function updateLogDutyStatus(
    editedFullLog: HosGraphLogEntry[],
    date: string,
    //form: EditDutyStatusFormValues
    //recentLogsFromServer?: HosGraphLogEntry[]
): Promise<{ success: boolean; message?: string;}> {
    if (!requireOnline()) {
        return { success: false };
    }

    try {
        // const payload = {
        //     log_id: log.log_id,
        //     date,
        //     start_time: moment(form.startTime).format('HH:mm:ss'),
        //     end_time: moment(form.endTime).format('HH:mm:ss'),
        //     shift_id: form.dutyStatus,
        //     location: form.location,
        //     notes: form.notes
        // };
        // logger.log("<<<<<<< Edit Duty Payload >>>>>>>>"+ JSON.stringify(payload));
        // const result = await apiPost(
        //     API.hos.editDutyStatusLog(log.log_id),
        //     (raw) => raw,
        //     payload
        // );

        const payload={
            log_date: date,
            log_data: editedFullLog
        };
        logger.log("<<<<<<< Edit Duty Payload >>>>>>>>"+ JSON.stringify(payload));
        const result = await apiPost(
            API.hos.editDutyStatusLog(),
            (raw) => raw,
            payload
        );
        return {
            success: isSuccess(result),
            message: result.message,
            //recentLogsFromServer: mapGraphEntry(result.data),
        };
        // return {
        //     success: true,
        //     message: ('Testing success')
        // };
    } catch (error: unknown) {
        return {
            success: false,
            message: getApiErrorMessage(error, 'Failed to update duty status')
        };
    }
}

function mapGraphEntry(data: Record<string, unknown>): HosGraphLogEntry[] | undefined {
    throw new Error('Function not implemented.');
}
