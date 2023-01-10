import React, { useCallback, useRef } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import useDefaultStyles from './Colors';
import { Gap } from './Utility';

export interface InputProps extends TextInputProps {
    icon?: React.ReactNode;
}

const Container = styled.Pressable`
    margin: 6px 0;
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    
    ${Platform.select({
        ios: css`padding: 12px;`,
        android: css`padding: 4px 12px;`,
    })}
`;

function Input({ icon = null, style, testID, ...rest }: InputProps) {
    const defaultStyles = useDefaultStyles();
    const inputRef = useRef<TextInput | null>(null);

    const handlePress = useCallback(() => inputRef.current?.focus(), []);

    return (
        <Container style={[defaultStyles.input, style]} onPress={handlePress} testID={`${testID}-container`} accessible={false}>
            {icon && (
                <>
                    {icon}
                    <Gap size={8} />
                </>
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