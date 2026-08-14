
import moment from 'moment';
import { HOSChartLine, HOSChartViolation, HOSGraphData } from '../../core/chart';
import { isValidTimeRange } from './hosTime';

export function transformHOSGraphData(
    graphData: HOSGraphData[] | undefined | null
): HOSChartLine[] {
    if (!Array.isArray(graphData)) {
        return [];
    }

    return graphData
        .map((item, index) => ({
            id: `${item.log_id}-${item.start_log_time}-${item.end_log_time}-${index}`,
            status: item.shift_id,
            start: item.start_log_time,
            end: item.end_log_time,
        }))
        .filter((item) => isValidTimeRange(item.start, item.end));
}

export function transformViolations(
    violations: HOSChartViolation[] | undefined | null
): HOSChartViolation[] {
    if (!Array.isArray(violations)) {
        return [];
    }
    return violations.map((item,index) => ({
        shift_id: `${item.shift_id}`,
        violation_startTime: `${moment(item.violation_startTime).format('HH:mm:ss')}`,
        violation_endTime: `${moment(item.violation_endTime).format('HH:mm:ss')}`,

    })).filter((item) =>
        isValidTimeRange(item.violation_startTime, item.violation_endTime)
    );
}
