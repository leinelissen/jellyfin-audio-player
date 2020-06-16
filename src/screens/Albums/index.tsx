import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import Albums from './components/Albums';
import Album from './components/Album';

const Stack = createStackNavigator<RootStackParamList>();

function AlbumStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Albums" component={Albums} />
            <Stack.Screen name="Album" component={Album} />
        </Stack.Navigator>
    );
}

export default AlbumStack;