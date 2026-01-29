import fs from 'fs';
import path from 'path';
import { localeGetters } from './index';

describe('Localisation', () => {
    it('should have a language getter for every locale file', () => {
        // Get all locale directories
        const langDir = path.join(__dirname, 'lang');
        const localeDirectories = fs.readdirSync(langDir, { withFileTypes: true })
            .filter((dirent: fs.Dirent) => dirent.isDirectory())
            .map((dirent: fs.Dirent) => dirent.name);

        // Get all getter keys
        const getterKeys = Object.keys(localeGetters);

        // Check each locale directory has a corresponding getter
        const missingGetters: string[] = [];
        
        for (const dir of localeDirectories) {
            // Check if there's a locale.json file in this directory
            const localeFilePath = path.join(langDir, dir, 'locale.json');
            if (fs.existsSync(localeFilePath)) {
                // Check if this locale has a getter (some use dashes instead of underscores)
                const hasGetter = getterKeys.some(key => 
                    key === dir || 
                    key === dir.replace(/_/g, '-') ||
                    key.replace(/-/g, '_') === dir
                );
                
                if (!hasGetter) {
                    missingGetters.push(dir);
                }
            }
        }

        if (missingGetters.length > 0) {
            throw new Error(
                `Missing language getters for the following locales: ${missingGetters.join(', ')}\n` +
                `Please add them to the localeGetters object in src/localisation/index.ts`
            );
        }

        expect(missingGetters).toHaveLength(0);
    });
});
