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

const Stack = createStackNavigator();
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
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const Icon = getIcon(route.name);

                    if (!Icon) {
                        return null;
                    }

                    return <Icon fill={color} width={size} height={size} />;
                }
            })}
            tabBarOptions={{
                activeTintColor: 'salmon',
                inactiveTintColor: 'gray',
            }}
        >
            <Tab.Screen name="NowPlaying" component={Player} options={{ tabBarLabel: 'Now Playing' }} />
            <Tab.Screen name="Music" component={Music} />
            <Tab.Screen name="Settings" component={Settings} />
        </Tab.Navigator>
    );
}

type Routes = {
    Screens: undefined;
    SetJellyfinServer: undefined;
}


export default function Routes() {
    return (
        <Stack.Navigator mode="modal" headerMode="none" screenOptions={{
            cardStyle: {
                backgroundColor: 'transparent'
            }
        }}>
            <Stack.Screen name="Screens" component={Screens} />
            <Stack.Screen name="SetJellyfinServer" component={SetJellyfinServer} />
        </Stack.Navigator>
    );
}

export type NavigationProp = CompositeNavigationProp<
    StackNavigationProp<Routes>,
    BottomTabNavigationProp<Screens>
>;