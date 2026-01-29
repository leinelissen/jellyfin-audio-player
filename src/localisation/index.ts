import { I18n } from 'i18n-js';
import { findBestLanguageTag } from 'react-native-localize';
import { LocaleKeys } from './types';

const i18n = new I18n();

// Lazy loaders for locale
const localeGetters: Record<string, () => object> = {
    bg: () => require('./lang/bg/locale.json'),
    ca: () => require('./lang/ca/locale.json'),
    cs: () => require('./lang/cs/locale.json'),
    da: () => require('./lang/da/locale.json'),
    de: () => require('./lang/de/locale.json'),
    en: () => require('./lang/en/locale.json'),
    es: () => require('./lang/es/locale.json'),
    fi: () => require('./lang/fi/locale.json'),
    fr: () => require('./lang/fr/locale.json'),
    hu: () => require('./lang/hu/locale.json'),
    id: () => require('./lang/id/locale.json'),
    it: () => require('./lang/it/locale.json'),
    ja: () => require('./lang/ja/locale.json'),
    nb_NO: () => require('./lang/nb_NO/locale.json'),
    nl: () => require('./lang/nl/locale.json'),
    pl: () => require('./lang/pl/locale.json'),
    pt: () => require('./lang/pt/locale.json'),
    pt_BR: () => require('./lang/pt_BR/locale.json'),
    ru: () => require('./lang/ru/locale.json'),
    sl: () => require('./lang/sl/locale.json'),
    sv: () => require('./lang/sv/locale.json'),
    ta: () => require('./lang/ta/locale.json'),
    uk: () => require('./lang/uk/locale.json'),
    zh: () => require('./lang/zh/locale.json'),
    'zh-Hant': () => require('./lang/zh_Hant/locale.json'),
    'zh-TW': () => require('./lang/zh_Hant/locale.json'),
};

// Have RNLocalize pick the best locale from the languages on offer
let locale = findBestLanguageTag(Object.keys(localeGetters));

// Check if the locale is correctly picked
if (!locale || !locale.languageTag) {
    // Some users might not list English as a fallback language, and hence might not
    // be assigned a locale. In this case, we'll just default to English.
    locale = {
        languageTag: 'en',
        isRTL: false,
    };
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
i18n.enableFallback = true;

/**
 * An i18n Typescript helper with autocomplete for the key argument
 * @param key string
 */
export function t(key: LocaleKeys) {
    return i18n.t(key);
}

export default i18n;