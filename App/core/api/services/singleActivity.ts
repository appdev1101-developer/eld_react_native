// import { hosApi } from '../../core/api/services/hosApi';
// import { isSuccess } from '../../core/api/types/common';
// import { requireOnline } from '../../core/network/requireOnline';
// import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
// import { EditActivityFormValues } from '../types/singleActivity.types';
// import { createEditActivityPayload } from '../utils/singleActivity.utils';

import { getApiErrorMessage } from "../../../Utils/apiErrorMessage";
import Util from "../../../Utils/util";
import { requireOnline } from "../../network/requireOnline";
import { isSuccess } from "../types/common";
import { EditActivityFormValues } from "../types/singleActivity";
import { hosApi } from "./hosApi";

export async function updateActivity(
    date: string,
    values: EditActivityFormValues
): Promise<{ success: boolean; message?: string }> {
    if (!requireOnline()) {
        return { success: false };
    }

    try {
        const payload = Util.createEditActivityPayload(date, values);
        const result = await hosApi.editActivity(payload);

        return {
            success: isSuccess(result),
            message: result.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getApiErrorMessage(
                error,
                'Failed to update activity'
            )
        };
    }
}

export async function certifyActivityLog(
    date: string,
    signatureUri: string,
    mimeType: string
): Promise<{ success: boolean; message?: string }> {
    if (!requireOnline()) {
        return { success: false };
    }

    try {
        const result = await hosApi.certifyLogSignature(
            date,
            signatureUri,
            mimeType
        );

        return {
            success: isSuccess(result),
            message: result.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getApiErrorMessage(
                error,
                'Failed to certify log'
            )
        };
    }
}


