import i18n from 'i18n-js';
import { findBestAvailableLanguage } from 'react-native-localize';
import { LocaleKeys } from './types';

// Lazy loaders for locale
const localeGetters: Record<string, () => object> = {
    en: () => require('./lang/en/locale.json'),
    fr: () => require('./lang/fr/locale.json'),
    nl: () => require('./lang/nl/locale.json'),
};

// Have RNLocalize pick the best locale from the languages on offer
const locale = findBestAvailableLanguage(Object.keys(localeGetters));

// Check if the locale is correctly picked
if (!locale || !locale.languageTag) {
    throw new Error('Invalid locale selected');
}

// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
    en: localeGetters.en(),
};

// If the locale is not english, we add it to the translations key s well
if (locale.languageTag !== 'en') {
    i18n.translations[locale.languageTag] = localeGetters[locale.languageTag as string]();
}

// Set the locale once at the beginning of your app.
i18n.locale = locale.languageTag;

// Fallback to the default language for missing translation strings
i18n.fallbacks = true;

/**
 * An i18n Typescript helper with autocomplete for the key argument
 * @param key string
 */
export function t(key: LocaleKeys) {
    return i18n.t(key);
}

export default i18n;