import React from 'react';
import styled from 'styled-components/native';
import { Text as BaseText, TextProps } from 'react-native';
import { PropsWithChildren } from 'react';
import useDefaultStyles from './Colors';

export function Text(props: PropsWithChildren<TextProps>) {
    const defaultStyles = useDefaultStyles();

    return (
        <BaseText {...props} style={[defaultStyles.text, props.style]} />
    );
}

export const Header = styled(Text)`
    margin: 0 0 6px 0;
    font-size: 28px;
    font-weight: 400;
`;

export const SubHeader = styled(Text)`
    font-size: 16px;
    margin: 0 0 6px 0;
    font-weight: 400;
    opacity: 0.5;
`;
