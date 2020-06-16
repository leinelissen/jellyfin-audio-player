import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import Player from './Player';
import Albums from './Albums';


const Tab = createBottomTabNavigator();

export default function Routes() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Now Playing" component={Player} />
            <Tab.Screen name="Albums" component={Albums} />
        </Tab.Navigator>
    );
}