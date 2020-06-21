import React from 'react';
import { TouchableOpacityProps, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/native';

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
            <Text style={{ color: 'salmon', fontSize: 16 }}>{children}</Text>
            <FontAwesomeIcon style={{ color: 'salmon' }} icon={faChevronRight} />
        </Container>
    );
};

export default ListButton;