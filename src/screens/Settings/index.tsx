import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Library from './components/Library';
import Cache from './components/Cache';
import useDefaultStyles, { ColoredBlurView } from 'components/Colors';
import { t } from '@localisation';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import ListButton from 'components/ListButton';
import { THEME_COLOR } from 'CONSTANTS';
import Sentry from './components/Sentry';
import { SettingsNavigationProp } from './types';
import { SafeScrollView } from 'components/SafeNavigatorView';
import PlaybackReporting from './components/PlaybackReporting';

export function SettingsList() {
    const navigation = useNavigation<SettingsNavigationProp>();
    const handleLibraryClick = useCallback(() => { navigation.navigate('Library'); }, [navigation]);
    const handleCacheClick = useCallback(() => { navigation.navigate('Cache'); }, [navigation]);
    const handleSentryClick = useCallback(() => { navigation.navigate('Sentry'); }, [navigation]);
    const handlePlaybackReportingClick = useCallback(() => { navigation.navigate('Playback Reporting'); }, [navigation]);

    return (
        <SafeScrollView>
            <ListButton onPress={handleLibraryClick}>{t('jellyfin-library')}</ListButton>
            <ListButton onPress={handleCacheClick}>{t('setting-cache')}</ListButton>
            <ListButton onPress={handleSentryClick}>{t('error-reporting')}</ListButton>
            <ListButton onPress={handlePlaybackReportingClick}>{t('playback-reporting')}</ListButton>
        </SafeScrollView>
    );
}

const Stack = createStackNavigator();

export default function Settings() {    
    const defaultStyles = useDefaultStyles();

    return (
        <Stack.Navigator initialRouteName="SettingList" screenOptions={{
            headerTintColor: THEME_COLOR,
            headerTitleStyle: defaultStyles.stackHeader,
            headerTransparent: true,
            headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
        }}>
            <Stack.Screen name="SettingList" component={SettingsList} options={{ headerTitle: t('settings') }} />
            <Stack.Screen name="Library" component={Library} options={{ headerTitle: t('jellyfin-library') }} />
            <Stack.Screen name="Cache" component={Cache} options={{ headerTitle: t('setting-cache') }} />
            <Stack.Screen name="Sentry" component={Sentry} options={{ headerTitle: t('error-reporting') }} />
            <Stack.Screen name="Playback Reporting" component={PlaybackReporting} options={{ headerTitle: t('playback-reporting')}} />
        </Stack.Navigator>
    );
}