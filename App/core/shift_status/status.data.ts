import { StatusDataType } from './status.types';

export const AllStatusData: StatusDataType[] = [
    {
        shift_status_id: 1,
        icon: require('../../Assets/Icons/OffDuty.png'),
        name: 'Off Duty',
        arcColors: ['#ee4e34', '#f17c3a', '#ed393e'],
        description:"Off duty"
    },
    {
        shift_status_id: 2,
        icon: require('../../Assets/Icons/Sleeper.png'),
        name: 'Sleeper',
        arcColors: ['#aeaeae', '#e6e4e1', '#818181'],
        description:"Off duty"
    },
    {
        shift_status_id: 4,
        icon: require('../../Assets/Icons/Break.png'),
        name: 'On Duty',
        arcColors: ['#f3c646', '#f5a841', '#b19359'],
        description:"Off duty"
    },
    {
        shift_status_id: 3,
        icon: require('../../Assets/Icons/drive.png'),
        name: 'Drive',
        overlayColor: '#72f575',
        selectedArc: 1,
        description:"Off duty"
    },
    {
        shift_status_id: 5,
        icon: require('../../Assets/Icons/PersonalUse.png'),
        name: 'Personal Use',
        arcColors: ['#6c746e', '#acada5', '#494b4f'],
        description:"Off duty"
    },
    {
        shift_status_id: 6,
        icon: require('../../Assets/Icons/YardMove.png'),
        name: 'Yard Move',
        overlayColor: '#eaf5a3',
        selectedArc: 2,
        description:"Off duty"
    },
];