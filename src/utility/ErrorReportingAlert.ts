import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useTypedSelector } from '@/store';
import { t } from '@/localisation';
import { setReceivedErrorReportingAlert } from '@/store/settings/actions';
import { setSentryStatus } from './Sentry';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from 'screens/types';

/**
 * This will send out an alert message asking the user if they want to enable
 * error reporting.
 */
export default function ErrorReportingAlert() {
    const { hasReceivedErrorReportingAlert } = useTypedSelector(state => state.settings);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();

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
            dispatch(setReceivedErrorReportingAlert());
        }
        
    }, [dispatch, hasReceivedErrorReportingAlert, navigation]);

    return null;
}