import React from 'react';
import { ViewProps } from 'react-native';
import styled from 'styled-components/native';
import useDefaultStyles from './Colors';

const Container = styled.View`
    height: 1px;
    flex: 1;
`;

function Divider({ style }: ViewProps) {
    const defaultStyles = useDefaultStyles();
    return (
        <Container style={[defaultStyles.divider, style]} />
    );
}

export default Divider;