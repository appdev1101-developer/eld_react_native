import Storage from '../../Utils/Storage';
import GeoDataBackgroundService from '../../Utils/GeoDataService';

const ELD_ONBOARDING_SKIPPED_KEY = '@truxy/eld_onboarding_skipped';

export async function markEldOnboardingSkipped(): Promise<void> {
    await Storage.set(ELD_ONBOARDING_SKIPPED_KEY, true);
}

export async function isEldOnboardingSkipped(): Promise<boolean> {
    const value = await Storage.get<boolean>(ELD_ONBOARDING_SKIPPED_KEY);
    return value === true;
}

export async function clearEldOnboardingSkipped(): Promise<void> {
    await Storage.remove(ELD_ONBOARDING_SKIPPED_KEY);
}

/** True when the driver should see Connect ELD before the dashboard. */
export async function shouldShowEldOnboarding(): Promise<boolean> {
    const [savedAddress, skipped] = await Promise.all([
        GeoDataBackgroundService.getSavedDeviceAddress(),
        isEldOnboardingSkipped()
    ]);

    if (savedAddress) {
        return false;
    }

    return !skipped;
}