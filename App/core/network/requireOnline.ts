import { showError } from '../../Utils/toast';
import { getIsOnline } from './networkMonitor';

const DEFAULT_OFFLINE_MESSAGE =
    'No internet connection. Please check your network and try again.';

export function requireOnline(message = DEFAULT_OFFLINE_MESSAGE): boolean {
    if (getIsOnline()) {
        return true;
    }

    showError(message);
    return false;
}