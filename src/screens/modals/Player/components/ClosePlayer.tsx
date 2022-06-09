import { useNavigation } from '@react-navigation/native';
import Button from 'components/Button';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';

function ClosePlayer() {
    const navigation = useNavigation();
    const closeModal = useCallback(() => {
        navigation.pop();
    }, [navigation]);

    if (Platform.OS === 'ios') {
        return null;
    }

    return (
        <Button onPress={closeModal}>CLOSE</Button>
    );
}

export default ClosePlayer;