import { Text } from '@/components/Typography';
import React, { useCallback } from 'react';
import { showRoutePicker, useAirplayRoutes } from 'react-airplay';
import { TouchableOpacity } from 'react-native';
import styled, { css } from 'styled-components/native';
import AirplayAudioIcon from '@/assets/icons/airplay-audio.svg';
import useDefaultStyles from '@/components/Colors';
import { t } from '@/localisation';

const Container = styled.View<{ active?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1 1 auto;

    ${(props) => props.active && css`
        padding: 8px;
        margin: -8px 0;
        border-radius: 8px;
    `}
`;

const Label = styled(Text)<{ active?: boolean }>`
    margin-left: 8px;
    opacity: 0.5;
    font-size: 13px;

    ${(props) => props.active && css`
        opacity: 1;
    `}
`;

function Casting() {
    const defaultStyles = useDefaultStyles();
    const routes = useAirplayRoutes();
    const handleClick = useCallback(() => showRoutePicker({}), []);

    return (
        <TouchableOpacity onPress={handleClick} activeOpacity={0.6}>
            <Container style={routes.length ? defaultStyles.activeBackground : undefined} active={routes.length > 0}>
                <AirplayAudioIcon
                    width={20}
                    height={20}
                    fill={routes.length > 0 ? defaultStyles.themeColor.color : defaultStyles.textHalfOpacity.color}
                />
                <Label
                    active={routes.length > 0}
                    numberOfLines={1}
                    style={routes.length > 0 && defaultStyles.themeColor}
                >
                    {routes.length > 0
                        ? `${t('playing-on')} ${routes.map((route) => route.portName).join(', ')}`
                        : t('local-playback')
                    }
                </Label>
            </Container>
        </TouchableOpacity>
    );
}

export default Casting;
