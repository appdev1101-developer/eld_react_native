import RNFS from 'react-native-fs';
import Util from '../../Utils/util';

/**
 * Local diagnostic log file — combines JS-side breadcrumbs (via
 * core/logger's log()/recordError()) and native Android logs (written
 * directly by native/FileLogger.kt from GeoDataForegroundService,
 * GeoDataUploader, etc.) into ONE file on device, so a single upload
 * captures the full picture of what happened, not just the JS half.
 *
 */

export const DIAGNOSTIC_LOG_FILE_NAME = `app-diagnostic-logs-${Util.convertToLogDateFormat()}.txt`;
const MAX_LOG_FILE_BYTES = 3 * 1024 * 1024; // 3MB — trimmed, not left to grow unbounded on a long-lived background service
const TRIM_TO_BYTES = 2 * 1024 * 1024; // keep the most recent 2MB when trimming

export function getDiagnosticLogFilePath(): string {
    return `${RNFS.DocumentDirectoryPath}/${DIAGNOSTIC_LOG_FILE_NAME}`;
}

// Serializes writes so concurrent JS-side calls (e.g. several log() calls
// fired in quick succession) don't interleave mid-write against each
// other — this only protects JS-side concurrency; see the concurrency
// note above regarding the native side.
let writeQueue: Promise<void> = Promise.resolve();

function formatLine(message: string, source: 'js' | 'native'): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${source}] ${message}\n`;
}

async function trimIfNeeded(path: string): Promise<void> {
    try {
        const stat = await RNFS.stat(path);
        const size = typeof stat.size === 'string' ? parseInt(stat.size, 10) : stat.size;
        if (size <= MAX_LOG_FILE_BYTES) {
            return;
        }

        const content = await RNFS.readFile(path, 'utf8');
        const trimmed = content.slice(Math.max(0, content.length - TRIM_TO_BYTES));
        // Cut at the next newline so we don't leave a partial line at the start.
        const firstNewline = trimmed.indexOf('\n');
        const clean = firstNewline >= 0 ? trimmed.slice(firstNewline + 1) : trimmed;
        await RNFS.writeFile(path, clean, 'utf8');
    } catch (error) {
        if (__DEV__) {
            console.warn('Diagnostic log trim failed', error);
        }
    }
}

export function appendDiagnosticLog(message: string, source: 'js' | 'native' = 'js'): void {
    const path = getDiagnosticLogFilePath();
    const line = formatLine(message, source);

    writeQueue = writeQueue
        .then(async () => {
            const exists = await RNFS.exists(path);
            if (exists) {
                await RNFS.appendFile(path, line, 'utf8');
                //await trimIfNeeded(path);
            } else {
                await RNFS.writeFile(path, line, 'utf8');
            }
        })
        .catch((error) => {
            if (__DEV__) {
                console.warn('Diagnostic log write failed', error);
            }
        });
}

export async function readDiagnosticLogFile(): Promise<string | null> {
    const path = getDiagnosticLogFilePath();
    try {
        const exists = await RNFS.exists(path);
        if (!exists) {
            return null;
        }
        return await RNFS.readFile(path, 'utf8');
    } catch (error) {
        if (__DEV__) {
            console.warn('Diagnostic log read failed', error);
        }
        return null;
    }
}

export async function clearDiagnosticLogFile(): Promise<void> {
    const path = getDiagnosticLogFilePath();
    try {
        const exists = await RNFS.exists(path);
        if (exists) {
            await RNFS.unlink(path);
        }
    } catch (error) {
        if (__DEV__) {
            console.warn('Diagnostic log clear failed', error);
        }
    }
}