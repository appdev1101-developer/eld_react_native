import React from 'react';
import { HosDayRecord, HosGraphLogEntry } from '../../core/api/types/hosLog';
import ActivityFormTab from './ActivityFormTab';
import ActivityLogTab from './ActivityLogTab';
import ActivitySignTab from './ActivitySignTab';
import { CoDriver, EditActivityFormValues, SingleActivityTab } from '../../core/api/types/singleActivity';


interface Props {
    timezone: string;
    onEditLog: (log: HosGraphLogEntry) => void;
    tab: SingleActivityTab;
    record?: HosGraphLogEntry[];
    formValues: EditActivityFormValues;
    coDrivers: CoDriver[];
    onFormChange: any;
    onSubmitForm: () => void;
    onSignature: (signature: string) => void;
}

const SingleActivityContent: React.FC<Props> = props => {
    switch (props.tab) {
        case 'log':
            return (
                <ActivityLogTab
                    logs={props.record ?? []}
                    timezone={props.timezone}
                    onEditLog={props.onEditLog}
                />
            );

        case 'form':
            return (
                <ActivityFormTab
                    values={props.formValues}
                    coDrivers={props.coDrivers}
                    onChange={props.onFormChange}
                    onSubmit={props.onSubmitForm}
                />
            );

        case 'sign':
            return (
                <ActivitySignTab
                    onSignature={props.onSignature}
                />
            );

        default:
            return null;
    }
};

export default SingleActivityContent;
