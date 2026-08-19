import moment from "moment";
import { EditActivityFormValues, EditActivityPayload } from "../core/api/types/singleActivity";

export const REFERENCE_DATE = '2000-01-01';

function convertToDayFormat(date: string, timezone?: string) : string
{
    return moment.tz(date, timezone ?? '').format('dddd');
}

function convertToMonthFormat(date: string, timezone?: string) : string
{
    return moment.tz(date, timezone ?? '').format('MMM DD');
}

function convertToTimeFormat(time: string) : string
{
    console.log("<<<<  Time >>>>>> "+time);
    const timeObj = moment(time, 'HH:mm:ss');
    return timeObj.format('HH [hr], mm [min]');
}


// Single Activity functions

function formatLogTimeRange(
    date: string,
    startTime: string,
    endTime: string,
    timezone: string
): string {
    const start = moment.tz(
        `${date} ${startTime}`,
        'YYYY-MM-DD HH:mm:ss',
        timezone
    );

    let end = moment.tz(
        `${date} ${endTime}`,
        'YYYY-MM-DD HH:mm:ss',
        timezone
    );

    if (!start.isValid() || !end.isValid()) {
        return `${startTime} - ${endTime}`;
    }

    // API may return an end time earlier than start for an overnight activity.
    if (end.isBefore(start)) {
        end = end.add(1, 'day');
    }

    const durationMinutes = Math.max(0, end.diff(start, 'minutes'));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    const durationLabel =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return `${start.format('h:mm A')} ${start.format('z')} | ${durationLabel}`;
}

function createEditActivityPayload(
    date: string,
    values: EditActivityFormValues
): EditActivityPayload {
    const nameParts = values.driverName.trim().split(/\s+/).filter(Boolean);

    return {
        first_name: nameParts[0] ?? '',
        last_name: nameParts.slice(1).join(' ') || 'B',
        date,
        cariier_name: values.carrierName,
        main_office_address: values.mainOfficeAddress,
        home_terminal_address: values.homeTerminalAddress,
        distance: values.distance,
        odometer: values.odometer,
        fromLoc: values.origin,
        toLoc: values.destination,
        notes: '',
        codriver_id: values.coDriverId
    };
}

function parseSignatureData(
    base64String: string
): { uri: string; mimeType: string } | null {
    const match = base64String.match(/^data:(.+);base64,(.+)$/);

    if (!match) {
        return null;
    }

    const [, mimeType, base64Data] = match;

    return {
        mimeType,
        uri: `data:${mimeType};base64,${base64Data}`
    };
}

////////

const Util= {
    convertToDayFormat,
    convertToMonthFormat,
    convertToTimeFormat,
    formatLogTimeRange,
    createEditActivityPayload,
    parseSignatureData,
    REFERENCE_DATE
}

export default Util;