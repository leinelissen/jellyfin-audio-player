import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentDirectoryPath, exists, readFile, writeFile, unlink, mkdir } from 'react-native-fs';
import { Storage } from 'redux-persist';

const STORAGE_BASE_PATH = DocumentDirectoryPath + '/store/';

/** Retrieve the path of a store file for a given key */
function getFileByKey(key: string) {
    return STORAGE_BASE_PATH + encodeURIComponent(key) + '.json';
}

/** Ensure that the store directory exists on the local filesystem */
async function ensureDirectoryExists() {
    if (!(await exists(STORAGE_BASE_PATH))) {
        await mkdir(STORAGE_BASE_PATH);
    }
}

/**
 * Migrates the Redux store from AsyncStorage to react-native-fs.
 */
const MigratedStorage: Storage = {
    async getItem(key) {
        const path = getFileByKey(key);

        // GUARD: Check whether a store already exists on the filesystem
        if (await exists(path)) {
            // In which case, we'll read it from disk
            return readFile(path);
        } else {
            // If not, attempt to read the previous store from AsyncStorage
            const oldStore = await AsyncStorage.getItem(key);

            // GUARD: If it exists, migrate it to a file on the filesystem
            if (oldStore) {
                await ensureDirectoryExists();
                await writeFile(path, oldStore);
                return oldStore;
            }
        }
    },
    removeItem(key) {
        return unlink(getFileByKey(key));
    },
    async setItem(key, value) {
        await ensureDirectoryExists();
        return writeFile(getFileByKey(key), value);
    },
};

export default MigratedStorage;