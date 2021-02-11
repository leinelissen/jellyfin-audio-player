import React, { PropsWithChildren } from 'react';
import { Text as BaseText, TextProps } from 'react-native';
import useDefaultStyles from './Colors';

export default function Text(props: PropsWithChildren<TextProps>) {
    const defaultStyles = useDefaultStyles();

    return (
        <BaseText {...props} style={[defaultStyles.text, props.style]} />
    );
}