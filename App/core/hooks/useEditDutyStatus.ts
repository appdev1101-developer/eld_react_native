import { useEffect, useState } from 'react';
import moment from 'moment';
import { HosGraphLogEntry } from '../api/types/hosLog';
import { EditDutyStatusFormValues } from '../api/types/editDutyStatus';
import { REFERENCE_DATE } from '../../Utils/util';
// import { HosGraphLogEntry } from '../../../core/api/types/hosLog';
// import { EditDutyStatusFormValues } from '../types/editDutyStatus.types';

// // Arbitrary fixed reference date — the time picker needs a real Date
// // object, but we only ever read/write the time-of-day portion back out.


function timeStringToDate(time: string): Date {
    const parsed = moment(`${REFERENCE_DATE} ${time}`, 'YYYY-MM-DD HH:mm:ss');
    return parsed.isValid() ? parsed.toDate() : moment(REFERENCE_DATE).toDate();
}

export function useEditDutyStatus(log: HosGraphLogEntry) {
    const [startTime, setStartTime] = useState<Date>(() =>
        timeStringToDate(log.start_log_time)
    );
    const [endTime, setEndTime] = useState<Date>(() =>
        timeStringToDate(log.end_log_time)
    );
    const [dutyStatus, setDutyStatus] = useState<number>(log.shift_id);
    const [location, setLocation] = useState<string>(log.location_start ?? '');
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // Re-initialize if the log identity actually changes (e.g. the screen
    // stays mounted but navigation params update to a different entry).
    useEffect(() => {
        setStartTime(timeStringToDate(log.start_log_time));
        setEndTime(timeStringToDate(log.end_log_time));
        setDutyStatus(log.shift_id);
        setLocation(log.location_start ?? '');
        setNotes('');
    }, [log.log_id]);

    const form: EditDutyStatusFormValues = {
        startTime,
        endTime,
        dutyStatus,
        location,
        notes
    };

    return {
        form,
        saving,
        setSaving,
        setStartTime,
        setEndTime,
        setDutyStatus,
        setLocation,
        setNotes
    };
}