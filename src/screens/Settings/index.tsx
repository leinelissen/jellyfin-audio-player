import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { t } from '@/localisation';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import ListButton from '@/components/ListButton';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';

import { SettingsNavigationProp } from './types';

import Cache from './stacks/Cache';
import Sentry from './stacks/Sentry';
import Library from './stacks/Library';
import ColorScheme from './stacks/ColorScheme';
import PlaybackReporting from './stacks/PlaybackReporting';
import { SafeScrollView } from '@/components/SafeNavigatorView';
import PrivacyPolicy from './components/PrivacyPolicy';

export function SettingsList() {
    const navigation = useNavigation<SettingsNavigationProp>();
    const handleLibraryClick = useCallback(() => { navigation.navigate('Library'); }, [navigation]);
    const handleCacheClick = useCallback(() => { navigation.navigate('Cache'); }, [navigation]);
    const handleSentryClick = useCallback(() => { navigation.navigate('Sentry'); }, [navigation]);
    const handlePlaybackReportingClick = useCallback(() => { navigation.navigate('Playback Reporting'); }, [navigation]);
    const handleColorSchemeClick = useCallback(() => { navigation.navigate('Color Scheme'); }, [navigation]);
    const handlePrivacyPolicyClick = useCallback(() => { navigation.navigate('PrivacyPolicy'); }, [navigation]);

    return (
        <SafeScrollView>
            <ListButton onPress={handleLibraryClick}>{t('jellyfin-library')}</ListButton>
            <ListButton onPress={handleCacheClick}>{t('setting-cache')}</ListButton>
            <ListButton onPress={handleSentryClick}>{t('error-reporting')}</ListButton>
            <ListButton onPress={handlePlaybackReportingClick}>{t('playback-reporting')}</ListButton>
            <ListButton onPress={handleColorSchemeClick}>{t('color-scheme')}</ListButton>
            <ListButton onPress={handlePrivacyPolicyClick}>{t('privacy-policy')}</ListButton>
        </SafeScrollView>
    );
}

const Stack = createStackNavigator();

export default function Settings() {    
    const defaultStyles = useDefaultStyles();

    return (
        <Stack.Navigator initialRouteName="SettingList" screenOptions={{
            headerTintColor: defaultStyles.themeColor.color,
            headerTitleStyle: defaultStyles.stackHeader,
            headerTransparent: true,
            headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
        }}>
            <Stack.Screen name="SettingList" component={SettingsList} options={{ headerTitle: t('settings') }} />
            <Stack.Screen name="Library" component={Library} options={{ headerTitle: t('jellyfin-library') }} />
            <Stack.Screen name="Cache" component={Cache} options={{ headerTitle: t('setting-cache') }} />
            <Stack.Screen name="Sentry" component={Sentry} options={{ headerTitle: t('error-reporting') }} />
            <Stack.Screen name="Playback Reporting" component={PlaybackReporting} options={{ headerTitle: t('playback-reporting')}} />
            <Stack.Screen name="Color Scheme" component={ColorScheme} options={{ headerTitle: t('color-scheme')}} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ headerTitle: t('privacy-policy') }} />
        </Stack.Navigator>
    );
}