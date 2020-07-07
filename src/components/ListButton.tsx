import React from 'react';
import { TouchableOpacityProps, Text } from 'react-native';
import ChevronRight from 'assets/chevron-right.svg';
import styled from 'styled-components/native';

const BUTTON_SIZE = 14;

const Container = styled.TouchableOpacity`
    padding: 18px 0;
    border-bottom-width: 1px;
    border-bottom-color: #eee;
    flex-direction: row;
    justify-content: space-between;
`;

const ListButton: React.FC<TouchableOpacityProps> = ({ children, ...props }) => {
    return (
        <Container {...props}>
            <Text style={{ color: '#FF3C00', fontSize: 16 }}>{children}</Text>
            <ChevronRight width={BUTTON_SIZE} height={BUTTON_SIZE} fill="#FF3C00" />
        </Container>
    );
};

export default ListButton;