import React from 'react';
import { View, SafeAreaView, ScrollView } from 'react-native';
import Library from './components/Library';
import Cache from './components/Cache';
import useDefaultStyles from 'components/Colors';
import { Header } from 'components/Typography';
import { t } from '@localisation';

export default function Settings() {
    const defaultStyles = useDefaultStyles();

    return (
        <ScrollView>
            <SafeAreaView>
                <View style={{ padding: 20 }}>
                    <Header style={defaultStyles.text}>{t('settings')}</Header>
                    <Library />
                    <Cache />
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}