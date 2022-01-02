import React, { useCallback, useState } from 'react';
import { TouchableOpacityProps } from 'react-native';
import ChevronRight from 'assets/chevron-right.svg';
import styled, { css } from 'styled-components/native';
import { THEME_COLOR } from 'CONSTANTS';
import useDefaultStyles from './Colors';

const BUTTON_SIZE = 14;

const Container = styled.Pressable<{ active?: boolean }>`
    padding: 18px 20px;
    border-bottom-width: 1px;
    flex-direction: row;
    justify-content: space-between;

    ${props => props.active && css`
        background-color: ${THEME_COLOR};
    `}
`;

const Label = styled.Text<{ active?: boolean }>`
    color: ${THEME_COLOR};
    font-size: 16px;

    ${props => props.active && css`
        color: white;
    `}
`;

const ListButton: React.FC<TouchableOpacityProps> = ({ children, ...props }) => {
    const defaultStyles = useDefaultStyles();
    const [isPressed, setPressed] = useState(false);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        // @ts-expect-error styled-components has outdated react-native typings
        <Container
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={defaultStyles.border}
            active={isPressed}
        >
            <Label active={isPressed}>{children}</Label>
            <ChevronRight width={BUTTON_SIZE} height={BUTTON_SIZE} fill={isPressed ? '#fff' : THEME_COLOR} />
        </Container>
    );
};

export default ListButton;