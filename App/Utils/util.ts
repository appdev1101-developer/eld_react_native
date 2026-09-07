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

function convertToLogDateFormat() : string
{
    return moment().format('DD-MM');
}

function convertToTimeFormat(time: string) : string
{
    const timeObj = moment(time, 'HH:mm:ss');
    return timeObj.format('HH [hr], mm [min]');
}
function convertDateToTimeStrFormat(selectedDate: Date) : string
{
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const seconds = selectedDate.getSeconds();

    // Format to 24-Hour String (e.g., "14:05")
    const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return time24;
}
function getSecondsFromMidnight(timeStr: string, zone:string) : number
{
  const parsed = moment.tz(`${REFERENCE_DATE} ${timeStr}`, "YYYY-MM-DD HH:mm:ss", zone);
  
  // Calculate total seconds from the start of that anchor day
  return (parsed.hour() * 3600) + (parsed.minute() * 60) + parsed.second();
};

/**
 * Converts total seconds back to a strict "HH:mm:ss" string.
 * It uses a modulo loop to safely roll over if seconds exceed 24 hours.
 */
function convertSecondsToTimeString(totalSeconds:number):string{
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((val) => String(val).padStart(2, "0")) // Adds leading zeros
    .join(":");
};

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
    REFERENCE_DATE,
    convertDateToTimeStrFormat,
    getSecondsFromMidnight,
    convertSecondsToTimeString,
    convertToLogDateFormat
}

export default Util;