import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { THEME_COLOR } from '@/CONSTANTS';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { StackParams } from 'screens/types';
import Search from './stacks/Search';
import Album from 'screens/Music/stacks/Album';
import { StyleSheet } from 'react-native';
import NowPlaying from 'screens/Music/overlays/NowPlaying';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator<StackParams>();

function SearchStack() {
    const defaultStyles = useDefaultStyles();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack.Navigator initialRouteName="Search" screenOptions={{
                headerTintColor: THEME_COLOR,
                headerTitleStyle: defaultStyles.stackHeader,
                cardStyle: defaultStyles.view,
                headerTransparent: true,
                headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
                
            }}>
                <Stack.Screen name="Search" component={Search} options={{ headerTitle: t('search'), headerShown: false }} />
                <Stack.Screen name="Album" component={Album} options={{ headerTitle: t('album') }} />
            </Stack.Navigator>
            <NowPlaying />
        </GestureHandlerRootView>
    );
}

export default SearchStack;