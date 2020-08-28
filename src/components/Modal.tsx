import React, { useCallback } from 'react';
import styled, { css } from 'styled-components/native';
import { SafeAreaView, Pressable } from 'react-native';
import { colors } from './Colors';
import { useNavigation, StackActions } from '@react-navigation/native';

interface Props {
    fullSize?: boolean;
}

const Background = styled(Pressable)`
    padding: 100px 25px;
    flex: 1;
    justify-content: center;
`;

const Container = styled(Pressable)<Pick<Props, 'fullSize'>>`
    border-radius: 20px;
    margin: auto 0;

    ${props => props.fullSize && css`
        flex: 1;
    `}
`;

const Modal: React.FC<Props> = ({ children, fullSize = true }) => {
    const navigation = useNavigation();
    const closeModal = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());    
    }, [navigation]);

    return (
        <Background style={colors.modal} onPress={closeModal}>
            <SafeAreaView style={{ flex: 1 }}>
                <Container style={colors.view} fullSize={fullSize}>
                    {children}
                </Container>
            </SafeAreaView>
        </Background>
    );
};

export default Modal;