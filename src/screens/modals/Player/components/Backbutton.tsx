import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import XmarkIcon from '@/assets/icons/xmark.svg';
import styled from 'styled-components/native';

const Container = styled.TouchableOpacity`
    padding: 12px 0px;
    z-index: 2;
`;

function BackButton() {
    const navigation = useNavigation();

    const handlePress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <Container onPress={handlePress}>
            <XmarkIcon />
        </Container>
    );
}

export default BackButton;