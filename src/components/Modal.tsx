import React from 'react';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native';
import { colors } from './Colors';

const Background = styled.View`
    padding: 100px 25px;
    flex: 1;
`;

const Container = styled.View`
    border-radius: 20px;
    flex: 1;
`;

const Modal: React.FC = ({ children }) => {
    return (
        <Background style={colors.modal}>
            <SafeAreaView style={{ flex: 1 }}>
                <Container style={colors.view}>
                    {children}
                </Container>
            </SafeAreaView>
        </Background>
    );
};

export default Modal;