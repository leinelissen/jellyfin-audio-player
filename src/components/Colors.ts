import { THEME_COLOR } from 'CONSTANTS';
import React from 'react';
import { useContext } from 'react';
import { ColorSchemeName, StyleSheet } from 'react-native';

/**
 * Function for generating both the dark and light stylesheets, so that they
 * don't have to be generate on every individual component render
 */
function generateStyles(scheme: ColorSchemeName) {
    return StyleSheet.create({
        text: {
            color: scheme === 'dark' ? '#fff' : '#000',
        },
        textHalfOpacity: {
            color: scheme === 'dark' ? '#ffffff88' : '#00000088',
        },
        view: {
            backgroundColor: scheme === 'dark' ? '#111' : '#eee',
        },
        border: {
            borderColor: scheme === 'dark' ? '#262626' : '#ddd',
        },
        activeBackground: {
            backgroundColor: `${THEME_COLOR}${scheme === 'dark' ? '66' : '16'}`,
        },
        imageBackground: {
            backgroundColor: scheme === 'dark' ? '#333' : '#ddd',
        },
        modal: {
            backgroundColor: scheme === 'dark' ? '#222222ee' : '#eeeeeeee',
        },
        modalInner: {
            backgroundColor: scheme === 'dark' ? '#000' : '#fff',
        },
        button: {
            backgroundColor: scheme === 'dark' ? '#161616' : '#e6e6e6',
        },
        input: {
            backgroundColor: scheme === 'dark' ? '#161616' : '#e6e6e6',
            color: scheme === 'dark' ? '#fff' : '#000',
        },
        sectionHeading: {
            backgroundColor: scheme === 'dark' ? '#111' : '#eee',
            borderColor: scheme === 'dark' ? '#333' : '#ddd',
        }
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