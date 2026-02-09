import { useEffect } from 'react';
import { Alert } from 'react-native';
import { t } from '@/localisation';
import { setReceivedErrorReportingAlert } from '@/store/settings/actions';
import { setSentryStatus } from './Sentry';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/screens/types';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import appSettings from '@/store/settings/entity';
import { eq } from 'drizzle-orm';

/**
 * This will send out an alert message asking the user if they want to enable
 * error reporting.
 */
export default function ErrorReportingAlert() {
    const { data: settings } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    const hasReceivedErrorReportingAlert = settings?.[0]?.hasReceivedErrorReportingAlert ?? false;
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        // Only send out alert if we haven't done so ever
        if (!hasReceivedErrorReportingAlert) {
            // Generate the alert
            Alert.alert(
                t('enable-error-reporting'),
                t('enable-error-reporting-description'),
                [
                    {
                        text: t('enable'),
                        style: 'default',
                        onPress: () => {
                            setSentryStatus(true);
                        }
                    },
                    {
                        text: t('disable'),
                        style: 'destructive',
                        onPress: () => {
                            setSentryStatus(false);
                        }
                    },
                    {
                        text: t('more-info'),
                        style: 'cancel',
                        onPress: () => {
                            navigation.navigate('ErrorReporting');
                        }
                    }
                ]
            );

            // Store the flag that we have sent out the alert, so that we don't
            // have to do so anymore in the future.
            setReceivedErrorReportingAlert();
        }
        
    }, [hasReceivedErrorReportingAlert, navigation]);

    return null;
}