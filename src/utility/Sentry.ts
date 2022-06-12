import { SENTRY_DSN } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const SENTRY_ASYNC__ITEM_STRING = 'sentry_enabled';
export let isSentryEnabled = false;

/**
 * Setup Sentry based on what value is stored in AsyncStorage. 
 */
export async function setupSentry(): Promise<void> {
    // First, we'll retrieve the user settings. This delays Sentry being active
    // slightly, at the bonus of acutally being able to send off reports for
    // start-up stuff.
    isSentryEnabled = (await AsyncStorage.getItem(SENTRY_ASYNC__ITEM_STRING)) === 'true';

    // Make sure the DSN is actually set, in order to prevent weird erros.
    if (SENTRY_DSN) {
        Sentry.init({
            dsn: SENTRY_DSN,
            // Before we send any event, check whether the Sentry SDK should be
            // enabled based on user settings.
            beforeSend(event) {
                // If so, pass off the event to the back-end
                if (isSentryEnabled) {
                    return event;
                }

                // If not, don't sent a thing
                return null;
            }
        });
    }
}

/**
 * Helper function to enable or disable the Sentry SDK for this app.
 */
export async function setSentryStatus(isEnabled: boolean): Promise<void> {
    // GUARD: If nothing's changed, change nothing
    if (isEnabled === isSentryEnabled) {
        return;
    }

    // First, store the value in Async Storage
    await AsyncStorage.setItem(SENTRY_ASYNC__ITEM_STRING, isEnabled.toString());

    // Then, assign it to the variable
    isSentryEnabled = isEnabled;
}