import React, { useCallback } from 'react';
import styled, { css } from 'styled-components/native';
import { SafeAreaView, Pressable } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';
import useDefaultStyles from './Colors';

interface Props {
    fullSize?: boolean;
}

const Background = styled(Pressable)`
    flex: 1;
    justify-content: center;
`;

const Container = styled(Pressable)<Pick<Props, 'fullSize'>>`
    margin: auto 20px;
    padding: 4px;
    border-radius: 8px;
    overflow: hidden;
    
    ${props => props.fullSize && css`
        flex: 1;
        margin: auto 0;
        border-radius: 0px;
    `}
`;

const Modal: React.FC<Props> = ({ children, fullSize = true }) => {
    const defaultStyles = useDefaultStyles();
    const navigation = useNavigation();
    const closeModal = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());    
    }, [navigation]);

    return (
        <Background style={defaultStyles.modal} onPress={closeModal}>
            <SafeAreaView style={{ flex: 1 }}>
                <Container style={defaultStyles.modalInner} fullSize={fullSize}>
                    {children}
                </Container>
            </SafeAreaView>
        </Background>
    );
};

export default Modal;