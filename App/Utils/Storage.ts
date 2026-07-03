import AsyncStorage from '@react-native-async-storage/async-storage';

async function get<T = unknown>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
        return null;
    }
    return JSON.parse(value) as T;
}

async function set(key: string, value: unknown): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage write failed silently, matching legacy behavior.
    }
}

async function remove(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // Storage remove failed silently, matching legacy behavior.
    }
}

async function clear(): Promise<void> {
    try {
        await AsyncStorage.clear();
    } catch {
        // Storage clear failed silently, matching legacy behavior.
    }
}

const Storage = {
    get,
    set,
    clear,
    remove
};

export default Storage;