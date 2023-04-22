import { BlurView, BlurViewProps } from '@react-native-community/blur';
import { THEME_COLOR } from 'CONSTANTS';
import React, { PropsWithChildren } from 'react';
import { useContext } from 'react';
import { ColorSchemeName, Platform, StyleSheet, View, useColorScheme } from 'react-native';

const majorPlatformVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

/**
 * Function for generating both the dark and light stylesheets, so that they
 * don't have to be generate on every individual component render
 */
function generateStyles(scheme: ColorSchemeName) {
    return StyleSheet.create({
        text: {
            color: scheme === 'dark' ? '#fff' : '#000',
            fontSize: 14,
            fontFamily: 'Inter',
        },
        textHalfOpacity: {
            color: scheme === 'dark' ? '#ffffff88' : '#00000088',
            fontSize: 14,
            // fontFamily: 'Inter',
        },
        textQuarterOpacity: {
            color: scheme === 'dark' ? '#ffffff44' : '#00000044',
            fontSize: 14,
        },
        view: {
            backgroundColor: scheme === 'dark' ? '#111' : '#fff',
        },
        border: {
            borderColor: scheme === 'dark' ? '#262626' : '#ddd',
        },
        activeBackground: {
            backgroundColor: `${THEME_COLOR}${scheme === 'dark' ? '26' : '16'}`,
        },
        imageBackground: {
            backgroundColor: scheme === 'dark' ? '#191919' : '#eee',
            borderWidth: 0.5,
            borderColor: scheme === 'dark' ? '#262626' : '#ddd',
        },
        modal: {
            backgroundColor: scheme === 'dark' ? '#000' : '#fff',
        },
        modalInner: {
            backgroundColor: scheme === 'dark' ? '#000' : '#fff',
        },
        button: {
            backgroundColor: scheme === 'dark' ? '#ffffff09' : '#00000009',
        },
        input: {
            backgroundColor: scheme === 'dark' ? '#191919' : '#f3f3f3',
            color: scheme === 'dark' ? '#fff' : '#000',
        },
        stackHeader: {
            color: scheme === 'dark' ? 'white' : 'black'
        },
        icon: {
            color: scheme === 'dark' ? '#ffffff4d' : '#0000004d',
        },
        divider: {
            backgroundColor: scheme === 'dark' ? '#333' : '#eee',
        },
        filter: {
            backgroundColor: scheme === 'dark' ? '#191919' : '#f3f3f3',
        },
    });
}

// Prerender both stylesheets
export const themes: Record<'dark' | 'light', ReturnType<typeof generateStyles>> = {
    'dark': generateStyles('dark'),
    'light': generateStyles('light'),
};

// Create context for supplying the theming information
export const ColorSchemeContext = React.createContext(themes.dark);

/**
 * Retrieves the default styles object in hook form 
 */
export default function useDefaultStyles() {
    return useContext(ColorSchemeContext);
}

interface DefaultStylesProviderProps {
    children: (defaultStyles: ReturnType<typeof useDefaultStyles>) => JSX.Element;
}

/**
 * A render props component to supply the defaultStyles object.
 */
export function DefaultStylesProvider(props: DefaultStylesProviderProps) {
    const defaultStyles = useDefaultStyles();

    return props.children(defaultStyles);
}

export function ColoredBlurView(props: PropsWithChildren<BlurViewProps>) {
    const scheme = useColorScheme();

    return Platform.OS === 'ios' ? (
        <BlurView
            {...props}
            blurType={Platform.OS === 'ios' && majorPlatformVersion >= 13 
                ? 'material'
                : scheme === 'dark' ? 'extraDark' : 'xlight'
            } />
    ) : (
        <View {...props} style={[ props.style, {
            backgroundColor: scheme === 'light' ? '#f6f6f6fb' : '#333333fb',
        } ]} />
    );
}