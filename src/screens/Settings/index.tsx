import React from 'react';
import { View, SafeAreaView, ScrollView } from 'react-native';
import { Header } from 'components/Typography';
import { colors } from 'components/Colors';
import Library from './components/Library';
import Cache from './components/Cache';

export default function Settings() {
    return (
        <ScrollView>
            <SafeAreaView>
                <View style={{ padding: 20 }}>
                    <Header style={colors.text}>Settings</Header>
                    <Library />
                    <Cache />
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}