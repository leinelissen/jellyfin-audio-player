import { THEME_COLOR } from 'CONSTANTS';
import React from 'react';
import AirPlayButton from 'react-native-airplay-button';
import styled from 'styled-components/native';
import { CastingProps } from './Casting';

const Button = styled.View`
    margin: 20px 40px;
`;

function Casting({ fill }: CastingProps) {
    return (
        <>
            <Button>
                <AirPlayButton 
                    activeTintColor={THEME_COLOR}
                    tintColor={fill}
                    style={{ width: 40, height: 40 }}
                />
            </Button>
        </>
    );
}

export default Casting;
