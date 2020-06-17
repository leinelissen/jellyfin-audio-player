import React from 'react';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native';

const Background = styled.View`
    background-color: #eeeeeeee;
    padding: 100px 25px;
    flex: 1;
`;

const Container = styled.View`
    background-color: white;
    border-radius: 20px;
    flex: 1;
`;

const Modal: React.FC = ({ children }) => {
    return (
        <Background>
            <SafeAreaView style={{ flex: 1}}>
                <Container>
                    {children}
                </Container>
            </SafeAreaView>
        </Background>
    );
};

export default Modal;