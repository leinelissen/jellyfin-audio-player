import React, { useCallback, useState } from 'react';
import { TouchableOpacityProps } from 'react-native';
import ChevronRight from '@/assets/icons/chevron-right.svg';
import styled from 'styled-components/native';
import { THEME_COLOR } from '@/CONSTANTS';
import useDefaultStyles from './Colors';

const BUTTON_SIZE = 14;

const Container = styled.Pressable<{ active?: boolean }>`
    padding: 14px 16px;
    border-radius: 8px;
    margin: 4px 8px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;

const Label = styled.Text<{ active?: boolean }>`
    color: ${THEME_COLOR};
    font-size: 16px;
`;

const ListButton: React.FC<TouchableOpacityProps> = ({ children, ...props }) => {
    const defaultStyles = useDefaultStyles();
    const [isPressed, setPressed] = useState(false);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        <Container
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                defaultStyles.border,
                isPressed ? defaultStyles.activeBackground : undefined
            ]}
        >
            <Label>{children}</Label>
            <ChevronRight width={BUTTON_SIZE} height={BUTTON_SIZE} fill={THEME_COLOR} />
        </Container>
    );
};

export default ListButton;