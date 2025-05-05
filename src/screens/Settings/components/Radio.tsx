import React, { useCallback } from 'react';
import styled from 'styled-components/native';
import CheckmarkIcon from '@/assets/icons/checkmark.svg';
import { Text } from '@/components/Typography';
import useDefaultStyles from '@/components/Colors';
import { Gap } from '@/components/Utility';
import { View } from 'react-native';

export const RadioList = styled.View`
    border-radius: 8px;
    overflow: hidden;
`;

const RadioItemContainer = styled.Pressable<{ checked?: boolean }>`
    padding: 16px 24px 16px 16px;
    border-bottom: 1px solid #444;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

export interface RadioItemProps<T> {
    checked?: boolean;
    label?: string;
    value: T;
    onPress: (value: T) => void;
    last?: boolean;
}

export function RadioItem<T>({ 
    checked,
    label,
    value,
    onPress,
    last
}: RadioItemProps<T>) {
    const defaultStyles = useDefaultStyles();

    const handlePress = useCallback(() => {
        onPress(value);
    }, [onPress, value]);

    return (
        <View style={!last ? { borderBottomWidth: 1, borderBottomColor: defaultStyles.divider.backgroundColor } : undefined}>
            <RadioItemContainer
                onPress={handlePress}
                style={({ pressed }) => [
                    { backgroundColor: pressed
                        ? defaultStyles.activeBackground.backgroundColor
                        : defaultStyles.button.backgroundColor 
                    }
                ]}
            >
                {checked ? <CheckmarkIcon fill={defaultStyles.themeColor.color} height={14} width={14} /> : <Gap size={14} />}
                <Gap size={8} />
                <Text style={checked && defaultStyles.themeColor}>{label}</Text>
            </RadioItemContainer>
        </View>
    );
}