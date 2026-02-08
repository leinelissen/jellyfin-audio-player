import React from 'react';
import { Platform } from 'react-native';
import { createNativeBottomTabNavigator, NativeBottomTabNavigationProp } from '@react-navigation/bottom-tabs/unstable';
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
import ErrorReportingPopup from './modals/ErrorReportingPopup';

import { t } from '@/localisation';
import ErrorReportingAlert from '@/utility/ErrorReportingAlert';
import useDefaultStyles from '@/components/Colors';
import Player from './modals/Player';
import { StackParams } from './types';
import Lyrics from './modals/Lyrics';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { appSettings } from '@/store/db/schema/app-settings';
import { eq } from 'drizzle-orm';

const Stack = createNativeStackNavigator<StackParams>();
const Tab = createNativeBottomTabNavigator();

type Screens = {
    Music: undefined;
    Settings: undefined;
}

function Screens() {
    const styles = useDefaultStyles();
    const { data: settings } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    const isOnboardingComplete = settings?.[0]?.isOnboardingComplete ?? false;

    // GUARD: If onboarding has not been completed, we instead render the
    // onboarding component, so that the user can get setup in the app.
    if (!isOnboardingComplete) {
        return <Onboarding />;
    }

    return (
        <>
            <ErrorReportingAlert />
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: styles.themeColor.color,
                    tabBarInactiveTintColor: styles.textHalfOpacity.color,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: styles.view.backgroundColor,
                    },
                }}
            >
                <Tab.Screen
                    name="MusicTab"
                    component={Music}
                    options={{
                        tabBarLabel: t('music'), 
                        tabBarIcon: Platform.select({
                            ios: {
                                type: 'sfSymbol',
                                name: 'music.note',
                            },
                            android: {
                                type: 'drawableResource',
                                name: 'ic_tab_music',
                            }
                        }),
                    }}
                />
                <Tab.Screen
                    name="SearchTab"
                    component={SearchStack}
                    options={{
                        tabBarLabel: t('search'), 
                        ...Platform.select({
                            ios: {
                                tabBarSystemItem: 'search',
                            },
                            android: {
                                tabBarIcon: {
                                    type: 'drawableResource',
                                    name: 'ic_tab_search',
                                }
                            }
                        }),
                    }}
                />
                <Tab.Screen
                    name="Downloads"
                    component={Downloads}
                    options={{
                        tabBarLabel: t('downloads'), 
                        ...Platform.select({
                            ios: {
                                tabBarSystemItem: 'downloads',
                            },
                            android: {
                                tabBarIcon: {
                                    type: 'drawableResource',
                                    name: 'ic_tab_downloads',
                                }
                            }
                        }),
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={Settings}
                    options={{
                        tabBarLabel: t('settings'), 
                        tabBarIcon: Platform.select({
                            ios: {
                                type: 'sfSymbol',
                                name: 'gearshape',
                            },
                            android: {
                                type: 'drawableResource',
                                name: 'ic_tab_settings',
                            }
                        }),
                    }}
                />
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
            contentStyle: {
                backgroundColor: 'transparent'
            }
        }} id="MAIN">
            <Stack.Screen name="Screens" component={Screens} />
            <Stack.Screen name="SetJellyfinServer" component={SetJellyfinServer} />
            <Stack.Screen name="TrackPopupMenu" component={TrackPopupMenu} options={{ presentation: 'formSheet', sheetCornerRadius: 10, sheetAllowedDetents: [0.85, 1.0]}} />
            <Stack.Screen name="ErrorReporting" component={ErrorReportingPopup} />
            <Stack.Screen name="Player" component={Player} />
            <Stack.Screen name="Lyrics" component={Lyrics} />
        </Stack.Navigator>
    );
}

export type NavigationProp = CompositeNavigationProp<
StackNavigationProp<Routes>,
NativeBottomTabNavigationProp<Screens>
>;
