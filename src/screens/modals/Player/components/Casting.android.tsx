import React from 'react';
import { Text } from 'react-native';
import styled from 'styled-components/native';

const Button = styled.View`
    margin: 20px 40px;
`;

function Casting() {
    return (
        <Button>
            <Text>Local Playback</Text>
        </Button>
    );
}

export default Casting;
