import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import SearchStack from './Search';
import Music from './Music';
import Settings from './Settings';
import Downloads from './Downloads';
import Onboarding from './Onboarding';
import TrackPopupMenu from './modals/TrackPopupMenu';
import SetJellyfinServer from './modals/SetJellyfinServer';

import SearchIcon from '@/assets/icons/magnifying-glass.svg';
import NotesIcon from '@/assets/icons/notes.svg';
import GearIcon from '@/assets/icons/gear.svg';
import DownloadsIcon from '@/assets/icons/arrow-down-to-line.svg';
import { useTypedSelector } from '@/store';
import { t } from '@/localisation';
import ErrorReportingAlert from '@/utility/ErrorReportingAlert';
import ErrorReportingPopup from './modals/ErrorReportingPopup';
import Player from './modals/Player';
import { StyleSheet } from 'react-native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { StackParams } from './types';

const Stack = createNativeStackNavigator<StackParams>();
const Tab = createBottomTabNavigator();

type Screens = {
    Music: undefined;
    Settings: undefined;
}

function Screens() {
    const styles = useDefaultStyles();
    const isOnboardingComplete = useTypedSelector(state => state.settings.isOnboardingComplete);
    
    // GUARD: If onboarding has not been completed, we instead render the
    // onboarding component, so that the user can get setup in the app.
    if (!isOnboardingComplete) {
        return <Onboarding />;
    }

    return (
        <>
            <ErrorReportingAlert />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: function TabBarIcon({ color, size }) {
                        switch (route.name) {
                            case 'SearchTab':
                                return <SearchIcon fill={color} height={size - 4} width={size - 4} />;
                            case 'MusicTab':
                                return <NotesIcon fill={color} height={size} width={size} />;
                            case 'Settings':
                                return <GearIcon fill={color} height={size - 1} width={size - 1} />;
                            case 'Downloads':
                                return <DownloadsIcon fill={color} height={size - 6} width={size - 6} />;
                            default:
                                return null;
                        }
                    },
                    tabBarActiveTintColor: styles.themeColor.color,
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: { position: 'absolute' },
                    tabBarBackground: () => (
                        <ColoredBlurView style={StyleSheet.absoluteFill} />
                    )
                })}
            >
                <Tab.Screen name="MusicTab" component={Music} options={{ tabBarLabel: t('music'), tabBarTestID: 'music-tab' }} />
                <Tab.Screen name="SearchTab" component={SearchStack} options={{ tabBarLabel: t('search'), tabBarTestID: 'search-tab' }} />
                <Tab.Screen name="Downloads" component={Downloads} options={{ tabBarLabel: t('downloads'), tabBarTestID: 'downloads-tab'}} />
                <Tab.Screen name="Settings" component={Settings} options={{ tabBarLabel: t('settings'), tabBarTestID: 'settings-tab' }} />
            </Tab.Navigator>
        </>
    );
}

type Routes = {
    Screens: undefined;
    SetJellyfinServer: undefined;
}

export default function Routes() {
    return (
        <Stack.Navigator screenOptions={{
            presentation: 'modal',
            headerShown: false,
        }} id="MAIN">
            <Stack.Screen name="Screens" component={Screens} />
            <Stack.Screen name="SetJellyfinServer" component={SetJellyfinServer} />
            <Stack.Screen name="TrackPopupMenu" component={TrackPopupMenu} options={{ presentation: 'formSheet' }} />
            <Stack.Screen name="ErrorReporting" component={ErrorReportingPopup} />
            <Stack.Screen name="Player" component={Player} />
        </Stack.Navigator>
    );
}

export type NavigationProp = CompositeNavigationProp<
StackNavigationProp<Routes>,
BottomTabNavigationProp<Screens>
>;