export const HOS_STATUS_ROWS = [
    { label: 'OFF', index: 0 },
    { label: 'SB', index: 1 },
    { label: 'D', index: 2 },
    { label: 'ON', index: 3 },
] as const;

export const HOS_ROW_INDEX_BY_STATUS: Record<number, number> = {
    1: 0, // Off Duty
    2: 1, // Sleeper Berth
    3: 2, // Driving
    4: 3, // On Duty
    5: 0, // Personal Conveyance -> Off row
    6: 3, // Yard Move -> On row
};

export const HOS_DASHED_STATUS_CODES = new Set<number>([5, 6]);

export const HOS_CHART_COLORS = {
    background: '#FFFFFF',
    gridMajor: '#CCCCCC',
    gridMinor: '#E2E2E2',
    text: '#222222',
    dutyLine: '#0075E7',
    violation: '#FF0000',
    border: '#CCCCCC',
} as const;

export const HOS_CHART_DEFAULTS = {
    chartHeight: 88,
    leftPadding: 30,
    topPadding: 14,
    bottomPadding: 32,
    rowGap: 0,
    strokeWidth: 1.5,
    dashArray: '4,3',
    majorGridWidth: 1,
    minorGridWidth: 1,
    labelFontSize: 8,
    hourLabelFontSize: 7,
} as const;
