import React from 'react';
import { TouchableOpacityProps, Text } from 'react-native';
import ChevronRight from 'assets/chevron-right.svg';
import styled from 'styled-components/native';
import { THEME_COLOR } from 'CONSTANTS';

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
            <Text style={{ color: THEME_COLOR, fontSize: 16 }}>{children}</Text>
            <ChevronRight width={BUTTON_SIZE} height={BUTTON_SIZE} fill={THEME_COLOR} />
        </Container>
    );
};

export default ListButton;