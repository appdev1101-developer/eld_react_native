
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  DeviceEventEmitter,
} from 'react-native';

import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { resetEldConnectionTracking } from '../../Utils/EldConnectionBeep';
import {
  ELD_EVENTS,
  EldConnectionStatus,
  EldConnectionStatusPayload,
} from '../../Utils/bleEvents';
import { logger } from '../logger';

const DATA_STALE_MS = 60_000;

export function useEldConnection() {
  const [status, setStatus] =
    useState<EldConnectionStatus>('disconnected');

  const lastDataTimeRef = useRef(0);
  const nativeStatusReceivedRef = useRef(false);
  const statusRef = useRef<EldConnectionStatus>('disconnected');

  const updateStatus = useCallback((nextStatus: EldConnectionStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const refreshConnectionStatus = useCallback(async () => {
    try {
      const savedAddress =
        await GeoDataBackgroundService.getSavedDeviceAddress();

      if (!savedAddress) {
        logger.log('useEldConnection: no saved ELD device');

        lastDataTimeRef.current = 0;
        nativeStatusReceivedRef.current = false;
        resetEldConnectionTracking();
        updateStatus('disconnected');
        return;
      }

      const lastDataTime = lastDataTimeRef.current;

      // Native status is the primary source when available.
      // This timer is only a fallback if data becomes stale.
      if (nativeStatusReceivedRef.current) {
        if (
          statusRef.current === 'connected' &&
          lastDataTime > 0 &&
          Date.now() - lastDataTime > DATA_STALE_MS
        ) {
          updateStatus('stale');
        }

        return;
      }

      // Backward-compatible fallback for builds that haven't started
      // emitting the detailed native status yet.
      if (lastDataTime > 0) {
        const elapsed = Date.now() - lastDataTime;

        updateStatus(
          elapsed <= DATA_STALE_MS ? 'connected' : 'stale',
        );
      }
    } catch (error) {
      logger.log(`useEldConnection refresh error: ${String(error)}`);
    }
  }, [updateStatus]);

  useEffect(() => {
    // New detailed native status event.
    const statusListener = DeviceEventEmitter.addListener(
      ELD_EVENTS.CONNECTION_STATUS,
      (event: EldConnectionStatusPayload) => {
        const nextStatus = event?.status;

        const validStatuses: EldConnectionStatus[] = [
          'connected',
          'connecting',
          'reconnecting',
          'disconnected',
          'stale',
        ];

        if (!validStatuses.includes(nextStatus)) {
          logger.log(
            `useEldConnection: invalid native status ${String(nextStatus)}`,
          );
          return;
        }

        nativeStatusReceivedRef.current = true;

        logger.log(`ELD native status: ${nextStatus}`);

        if (nextStatus === 'disconnected') {
          lastDataTimeRef.current = 0;
          resetEldConnectionTracking();
        }

        updateStatus(nextStatus);
      },
    );

    // Existing live-data event retained.
    const dataListener = DeviceEventEmitter.addListener(
      ELD_EVENTS.DATA,
      () => {
        lastDataTimeRef.current = Date.now();

        logger.log(
          `ELD data received at ${lastDataTimeRef.current}`,
        );

        // A fresh ELD measurement confirms data is flowing.
        updateStatus('connected');
      },
    );

    void refreshConnectionStatus();

    const staleCheckInterval = setInterval(() => {
      void refreshConnectionStatus();
    }, 5000);

    const appStateListener = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        logger.log(`ELD app state changed: ${state}`);
        if (state === 'active') {
          void refreshConnectionStatus();
        }
      },
    );

    return () => {
      statusListener.remove();
      dataListener.remove();
      clearInterval(staleCheckInterval);
      appStateListener.remove();
    };
  }, [refreshConnectionStatus, updateStatus]);

  const isConnected = status === 'connected';

  return {
    isConnected,
    status,
    refreshConnectionStatus,
  };
}