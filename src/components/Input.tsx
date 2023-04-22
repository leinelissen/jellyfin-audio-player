import React, { useCallback, useRef } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import useDefaultStyles from './Colors';

export interface InputProps extends TextInputProps {
    icon?: React.ReactNode;
}

const Container = styled.Pressable<{ hasIcon?: boolean }>`
    position: relative;
    margin: 6px 0;
    border-radius: 12px;
    display: flex;
    
    ${Platform.select({
        ios: css`padding: 12px;`,
        android: css`padding: 4px 12px;`,
    })}

    ${({ hasIcon }) => hasIcon && css`
        padding-left: 36px;
    `}
`;

const IconWrapper = styled.View`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    padding-left: 12px;
`;

function Input({ icon = null, style, testID, ...rest }: InputProps) {
    const defaultStyles = useDefaultStyles();
    const inputRef = useRef<TextInput | null>(null);

    const handlePress = useCallback(() => inputRef.current?.focus(), []);

    return (
        <Container
            style={[defaultStyles.input, style]}
            onPress={handlePress}
            testID={`${testID}-container`}
            accessible={false}
            hasIcon={!!icon}
        >
            {icon && (
                <IconWrapper>
                    {icon}
                </IconWrapper>
            )}
            <TextInput
                {...rest}
                style={[defaultStyles.text, { margin: 0, padding: 0 }]}
                ref={inputRef}
                testID={`${testID}-textinput`}
            />
        </Container>
    );
}

export default Input;