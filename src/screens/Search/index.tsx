import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { StackParams } from '@/screens/types';
import Search from './stacks/Search';
import Album from '@/screens/Music/stacks/Album';
import { StyleSheet } from 'react-native';
import NowPlaying from '@/screens/Music/overlays/NowPlaying';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator<StackParams>();

function SearchStack() {
    const defaultStyles = useDefaultStyles();
    const [isInitialRoute, setIsInitialRoute] = useState(true);

    return (
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
            </Stack.Navigator>
            <NowPlaying offset={isInitialRoute ? 64 : 0} />
        </GestureHandlerRootView>
    );
}

export default SearchStack;