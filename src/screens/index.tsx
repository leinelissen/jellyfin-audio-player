import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { THEME_COLOR } from 'CONSTANTS';

import Search from './Search';
import Music from './Music';
import Settings from './Settings';
import Downloads from './Downloads';
import Onboarding from './Onboarding';
import TrackPopupMenu from './modals/TrackPopupMenu';
import SetJellyfinServer from './modals/SetJellyfinServer';

import SearchIcon from 'assets/magnifying-glass.svg';
import NotesIcon from 'assets/notes.svg';
import GearIcon from 'assets/gear.svg';
import DownloadsIcon from 'assets/arrow-down-to-line.svg';
import { useTypedSelector } from 'store';
import { ModalStackParams } from './types';
import { t } from '@localisation';
import ErrorReportingAlert from 'utility/ErrorReportingAlert';
import ErrorReportingPopup from './modals/ErrorReportingPopup';

const Stack = createStackNavigator<ModalStackParams>();
const Tab = createBottomTabNavigator();

type Screens = {
    NowPlaying: undefined;
    Music: undefined;
    Settings: undefined;
}

function Screens() {
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
                            case 'Search':
                                return <SearchIcon fill={color} height={size - 4} width={size - 4} />;
                            case 'Music':
                                return <NotesIcon fill={color} height={size} width={size} />;
                            case 'Settings':
                                return <GearIcon fill={color} height={size - 1} width={size - 1} />;
                            case 'Downloads':
                                return <DownloadsIcon fill={color} height={size - 6} width={size - 6} />;
                            default:
                                return null;
                        }
                    },
                    tabBarActiveTintColor: THEME_COLOR,
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Music" component={Music} options={{ tabBarLabel: t('music') }} />
                <Tab.Screen name="Search" component={Search} options={{ tabBarLabel: t('search') }} />
                <Tab.Screen name="Downloads" component={Downloads} options={{ tabBarLabel: t('downloads')}} />
                <Tab.Screen name="Settings" component={Settings} options={{ tabBarLabel: t('settings') }} />
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
            cardStyle: {
                backgroundColor: 'transparent'
            },
            presentation: 'modal',
            headerShown: false,
        }}>
            <Stack.Screen name="Screens" component={Screens} />
            <Stack.Screen name="SetJellyfinServer" component={SetJellyfinServer} />
            <Stack.Screen name="TrackPopupMenu" component={TrackPopupMenu} />
            <Stack.Screen name="ErrorReporting" component={ErrorReportingPopup} />
        </Stack.Navigator>
    );
}

export type NavigationProp = CompositeNavigationProp<
StackNavigationProp<Routes>,
BottomTabNavigationProp<Screens>
>;