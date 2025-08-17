import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { StackParams } from '@/screens/types';
import Search from './stacks/Search';
import Album from '@/screens/Music/stacks/Album';
import Artist from '@/screens/Music/stacks/Artist';
import Playlist from '@/screens/Music/stacks/Playlist';
import { StyleSheet } from 'react-native';
import NowPlaying from '@/screens/Music/overlays/NowPlaying';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createStackNavigator<StackParams>();

function SearchStack() {
    const defaultStyles = useDefaultStyles();
    const [isInitialRoute, setIsInitialRoute] = useState(true);

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack.Navigator initialRouteName="Search"
                    screenOptions={{
                        headerTintColor: defaultStyles.themeColor.color,
                        headerTitleStyle: defaultStyles.stackHeader,
                        cardStyle: defaultStyles.view,
                        headerTransparent: true,
                        headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
                    }}
                    screenListeners={{
                        state: (e) => {
                            const { state: { routes } } = e.data as { state: { routes?: { key: string, name: string }[] } };
                            setIsInitialRoute(routes?.length === 1);
                        }
                    }}
                >
                    <Stack.Screen name="Search" component={Search} options={{ headerTitle: t('search'), headerShown: false }} />
                    <Stack.Screen name="Album" component={Album} options={{ headerTitle: t('album') }} />
                    <Stack.Screen name="Artist" component={Artist} options={({ route }) => ({ headerTitle: route.params.name })} />
                    <Stack.Screen name="Playlist" component={Playlist} options={{ headerTitle: t('playlist') }} />
                </Stack.Navigator>
                <NowPlaying offset={isInitialRoute ? 64 : 0} />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

export default SearchStack;
