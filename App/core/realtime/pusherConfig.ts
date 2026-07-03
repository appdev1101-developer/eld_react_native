import { MAIN_BASE_URL } from '../../Utils/EnvVariables';

export const PUSHER_API_KEY = '7ede0e0642bfe8c67615';
export const PUSHER_CLUSTER = 'ap2';

export function getPusherAuthEndpoint(): string {
    return `${MAIN_BASE_URL}/broadcasting/auth`;
}

export function getPrivateUserChannel(userId: number | string): string {
    return `private-user-${userId}`;
}