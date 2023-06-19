import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import XmarkIcon from '@/assets/icons/xmark.svg';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
    padding: 6px 12px;
`;

function BackButton() {
    const navigation = useNavigation();

    const handlePress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <Container>
            <TouchableOpacity onPress={handlePress}>
                <XmarkIcon />
            </TouchableOpacity>
        </Container>
    );
}

export default BackButton;