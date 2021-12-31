import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import SetJellyfinServer from './modals/SetJellyfinServer';
import Player from './Player';
import Music from './Music';
import Settings from './Settings';
import PlayPauseIcon from 'assets/play-pause-fill.svg';
import NotesIcon from 'assets/notes.svg';
import GearIcon from 'assets/gear.svg';
import { THEME_COLOR } from 'CONSTANTS';
import { useTypedSelector } from 'store';
import Onboarding from './Onboarding';
import TrackPopupMenu from './modals/TrackPopupMenu';
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

function getIcon(route: string): React.FC<any> | null {
    switch(route) {
        case 'NowPlaying':
            return PlayPauseIcon;
        case 'Music':
            return NotesIcon;
        case 'Settings':
            return GearIcon;
        default:
            return null;
    }
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
                        const Icon = getIcon(route.name);

                        if (!Icon) {
                            return null;
                        }

                        return <Icon fill={color} width={size} height={size} />;
                    },
                    tabBarActiveTintColor: THEME_COLOR,
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                })}
            >
                <Tab.Screen name="NowPlaying" component={Player} options={{ tabBarLabel: t('now-playing') }} />
                <Tab.Screen name="Music" component={Music} options={{ tabBarLabel: t('music') }} />
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