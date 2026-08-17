import React from 'react';
import { HosDayRecord } from '../../core/api/types/hosLog';
import ActivityFormTab from './ActivityFormTab';
import ActivityLogTab from './ActivityLogTab';
import ActivitySignTab from './ActivitySignTab';
import { CoDriver, EditActivityFormValues, SingleActivityTab } from '../../core/api/types/singleActivity';


interface Props {
    tab: SingleActivityTab;
    record?: HosDayRecord;
    timezone: string;
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
                    record={props.record}
                    timezone={props.timezone}
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
