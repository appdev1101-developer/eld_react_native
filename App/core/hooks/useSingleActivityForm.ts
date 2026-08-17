import { useEffect, useState } from 'react';
import { HosDayRecord } from '../../core/api/types/hosLog';
import { RootState } from '../../Redux/store';
import { CoDriver, EditActivityFormValues } from '../api/types/singleActivity';


interface UseSingleActivityFormArgs {
    record?: HosDayRecord;
    userInfo?: RootState['User']['userInfo'];
}

export function useSingleActivityForm({
    record,
    userInfo
}: UseSingleActivityFormArgs) {
    const [distance, setDistance] = useState(
        record?.log.distance_diffr?.toString() ?? '0'
    );
    const [odometer, setOdometer] = useState(
        record?.log.odometer?.toString() ?? '0'
    );
    const [driverName, setDriverName] = useState(
        `${userInfo?.username ?? ''}`.trim()
    );
    const [carrierName, setCarrierName] = useState(
        `${userInfo?.career_name ?? ''}`.trim()
    );
    const [mainOfficeAddress, setMainOfficeAddress] = useState(
        `${userInfo?.main_office_address ?? ''}`.trim()
    );
    const [homeTerminalAddress, setHomeTerminalAddress] = useState(
        `${userInfo?.home_terminal_address ?? ''}`.trim()
    );
    const [coDrivers, setCoDrivers] = useState<CoDriver[]>(
        record?.log.coDriver_list ?? []
    );
    const [selectedCoDriver, setSelectedCoDriver] = useState('');
    const [origin, setOrigin] = useState(
        record?.log.start_location ?? 'None'
    );
    const [destination, setDestination] = useState(
        record?.log.location_end ?? 'None'
    );

    useEffect(() => {
        setDistance(record?.log.distance_diffr?.toString() ?? '0');
        setOdometer(record?.log.odometer?.toString() ?? '0');
        setDriverName(`${userInfo?.username ?? ''}`.trim());
        setCarrierName(`${userInfo?.career_name ?? ''}`.trim());
        setMainOfficeAddress(
            `${userInfo?.main_office_address ?? ''}`.trim()
        );
        setHomeTerminalAddress(
            `${userInfo?.home_terminal_address ?? ''}`.trim()
        );
        setCoDrivers(record?.log.coDriver_list ?? []);
        setSelectedCoDriver('');
        setOrigin(record?.log.start_location ?? 'None');
        setDestination(record?.log.location_end ?? 'None');
    }, [record, userInfo]);

    const values: EditActivityFormValues = {
        distance,
        odometer,
        driverName,
        carrierName,
        mainOfficeAddress,
        homeTerminalAddress,
        coDriverId: selectedCoDriver,
        origin,
        destination
    };

    return {
        values,
        coDrivers,
        setDistance,
        setOdometer,
        setDriverName,
        setCarrierName,
        setMainOfficeAddress,
        setHomeTerminalAddress,
        setSelectedCoDriver,
        setOrigin,
        setDestination
    };
}
