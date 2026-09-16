import { useCallback, useState } from 'react';
import { uploadDiagnosticLogs } from '../api/services/diagnosticApi';
import { showError, showToast } from '../../Utils/toast';
import { sendDebugCrashlyticsTest } from '../../core/hooks/useSession';

export function useDiagnosticLogs() {
    const [sending, setSending] = useState(false);

    const sendDiagnosticLogs = useCallback(async () => {
        if (sending) {
            return;
        }

        setSending(true);
        try {
            const result = await uploadDiagnosticLogs();

            if (result.success) {
                showToast(result.message ?? 'Diagnostic logs sent.');
            } else if (result.empty) {
                showToast('No diagnostic logs to send yet.');
            } else {
                showError(result.message ?? 'Failed to send diagnostic logs.');
            }
        } finally {
            setSending(false);
            sendDebugCrashlyticsTest();
        }
    }, [sending]);

    return { sendDiagnosticLogs, sending };
}