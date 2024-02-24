import { BlurView, BlurViewProps } from '@react-native-community/blur';
import React, { PropsWithChildren } from 'react';
import { useContext } from 'react';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { useTypedSelector } from '@/store';
import { ColorScheme } from '@/store/settings/types';
import { useAccessibilitySetting } from 'react-native-accessibility-settings';

const majorPlatformVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

/**
 * Retrieve text color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getTextColor(scheme: ColorScheme) {
    let color = '#000';

    switch (scheme) {
        case 'dark':
            color = '#fff';
            break;
        case 'black':
            color = '#fff';
            break;
    }

    return color;
}

/**
 * Retrieve text half opacity color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getTextHalfOpacityColor(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#000000bb' : '#00000088';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#ffffffbb' : '#ffffff88';
            break;
        case 'black':
            color = highContrast ? '#FFFFFFD1' : '#FFFFFFB5';
            break;
    }

    return color;
}

/**
 * Retrieve text quarter opacity color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getTextQuarterOpacity(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#000000bb' : '#00000088';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#ffffff88' : '#ffffff44';
            break;
        case 'black':
            color = highContrast ? '#FFFFFFB2' : '#FFFFFF8E';
            break;
    }

    return color;
}

/**
 * Retrieve view background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getViewBackgroundColor(scheme: ColorScheme) {
    let color = '#fff';

    switch (scheme) {
        case 'dark':
            color = '#111';
            break;
        case 'black':
            color = '#000';
            break;
    }

    return color;
}

/**
 * Retrieve modal background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getModalBackgroundColor(scheme: ColorScheme) {
    let color = '#fff';

    switch (scheme) {
        case 'dark':
            color = '#111';
            break;
        case 'black':
            color = '#000';
            break;
    }

    return color;
}

/**
 * Retrieve border color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getBorderColor(scheme: ColorScheme) {
    let color = '#ddd';

    switch (scheme) {
        case 'dark':
            color = '#050505';
            break;
        case 'black':
            color = '#050505';
            break;
    }

    return color;
}

/**
 * Retrieve input background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getInputBackgroundColor(scheme: ColorScheme) {
    let color = '#f3f3f3';

    switch (scheme) {
        case 'dark':
            color = '#080808';
            break;
        case 'black':
            color = '#080808';
            break;
    }

    return color;
}

/**
 * Retrieve active background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getActiveBackgroundColor(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#8b513c10' : '#FF3C0016';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#00000026' : '#FF3C0026';
            break;
        case 'black':
            color = highContrast ? '#00000026' : '#00000026';
            break;
    }

    return color;
}

/**
 * Retrieve button background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getButtonBackgroundColor(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#0000000f' : '#00000009';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#ffffff0f' : '#ffffff09';
            break;
        case 'black':
            color = highContrast ? '#ffffff0f' : '#ffffff09';
            break;
    }

    return color;
}

/**
 * Retrieve stack header color
 * 
 * @param scheme ColorScheme
 * @returns String
 */
function getStackHeaderColor(scheme: ColorScheme) {
    let color = 'black';

    switch (scheme) {
        case 'dark':
            color = 'white';
            break;
        case 'black':
            color = 'white';
            break;
    }

    return color;
}

/**
 * Retrieve input color
 * 
 * @param scheme ColorScheme
 * @returns String
 */
function getInputColor(scheme: ColorScheme) {
    let color = '#000';

    switch (scheme) {
        case 'dark':
            color = '#fff';
            break;
        case 'black':
            color = '#fff';
            break;
    }

    return color;
}

/**
 * Retrieve icon color
 * 
 * @param scheme ColorScheme
 * @returns String
 */
function getIconColor(scheme: ColorScheme) {
    let color = '#0000004d';

    switch (scheme) {
        case 'dark':
            color = '#ffffff4d';
            break;
        case 'black':
            color = '#ffffff4d';
            break;
    }

    return color;
}

/**
 * Retrieve image background color
 * 
 * @param scheme ColorScheme
 * @returns String
 */
function getImageBackgroundColor(scheme: ColorScheme) {
    let color = '#eee';

    switch (scheme) {
        case 'dark':
            color = '#191919';
            break;
        case 'black':
            color = '#020202';
            break;
    }

    return color;
}

/**
 * Retrieve divider background color
 * 
 * @param scheme ColorScheme
 * @returns String
 */
function getDividerBackgroundColor(scheme: ColorScheme) {
    let color = '#eee';

    switch (scheme) {
        case 'dark':
            color = '#333';
            break;
        case 'black':
            color = '#111';
            break;
    }

    return color;
}

/**
 * Retrieve theme color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getThemeColor(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#c93400' : '#FF3C00';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#FF7A1C' : '#FF3C00';
            break;
        case 'black':
            color = highContrast ? '#FDFDFD' : '#FDFDFD';
            break;
    }

    return color;
}

/**
 * Retrieve theme color half opacity
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getThemeColorHalfOpacity(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#c93400bb' : '#FF3C0088';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#FF7A1Cbb' : '#FF3C0088';
            break;
        case 'black':
            color = highContrast ? '#FDFDFD' : '#FDFDFD';
            break;
    }

    return color;
}

/**
 * Retrieve theme color quarter opacity
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getThemeColorQuarterOpacity(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#c9340088' : '#FF3C0044';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#FF7A1C88' : '#FF3C0044';
            break;
        case 'black':
            color = highContrast ? '#FDFDFD' : '#FDFDFD';
            break;
    }

    return color;
}

/**
 * Retrieve theme background color
 * 
 * @param scheme ColorSchemeName
 * @returns String
 */
function getThemeBackgroundColor(scheme: ColorScheme, highContrast: boolean) {
    let color = highContrast ? '#c93400' : '#FF3C00';

    switch (scheme) {
        case 'dark':
            color = highContrast ? '#FF7A1C' : '#FF3C00';
            break;
        case 'black':
            color = highContrast ? '#FDFDFD' : '#FDFDFD';
            break;
    }

    return color;
}

/**
 * Function for generating both the dark and light stylesheets, so that they
 * don't have to be generate on every individual component render
 */
function generateStyles(scheme: ColorScheme, highContrast: boolean) {
    return StyleSheet.create({
        text: {
            color: getTextColor(scheme),
            fontSize: 14,
            fontFamily: 'Inter',
        },
        textHalfOpacity: {
            color: getTextHalfOpacityColor(scheme, highContrast),
            fontSize: 14,
        },
        textQuarterOpacity: {
            color: getTextQuarterOpacity(scheme, highContrast),
            fontSize: 14,
        },
        view: {
            backgroundColor: getViewBackgroundColor(scheme),
        },
        border: {
            borderColor: getBorderColor(scheme),
        },
        activeBackground: {
            backgroundColor: getActiveBackgroundColor(scheme, highContrast),
        },
        imageBackground: {
            backgroundColor: getImageBackgroundColor(scheme),
            borderWidth: 0.5,
            borderColor: getBorderColor(scheme),
        },
        modal: {
            backgroundColor: getModalBackgroundColor(scheme),
        },
        modalInner: {
            backgroundColor: getModalBackgroundColor(scheme),
        },
        button: {
            backgroundColor: getButtonBackgroundColor(scheme, highContrast),
        },
        input: {
            backgroundColor: getInputBackgroundColor(scheme),
            color: getInputColor(scheme),
        },
        stackHeader: {
            color: getStackHeaderColor(scheme)
        },
        icon: {
            color: getIconColor(scheme),
        },
        divider: {
            backgroundColor: getDividerBackgroundColor(scheme),
        },
        filter: {
            backgroundColor: getInputBackgroundColor(scheme),
        },
        themeColor: {
            color: getThemeColor(scheme, highContrast),
        },
        themeColorHalfOpacity: {
            color: getThemeColorHalfOpacity(scheme, highContrast),
        },
        themeColorQuarterOpacity: {
            color: getThemeColorQuarterOpacity(scheme, highContrast),
        },
        themeBackground: {
            backgroundColor: getThemeBackgroundColor(scheme, highContrast),
        }
    });
}

// Prerender both stylesheets
export const themes: Record<'dark' | 'light' | 'dark-highcontrast' | 'light-highcontrast' | 'black' | 'black-highcontrast', ReturnType<typeof generateStyles>> = {
    'dark': generateStyles(ColorScheme.Dark, false),
    'light': generateStyles(ColorScheme.Light, false),
    'black': generateStyles(ColorScheme.Black, false),
    'dark-highcontrast': generateStyles(ColorScheme.Dark, true),
    'light-highcontrast': generateStyles(ColorScheme.Light, true),
    'black-highcontrast': generateStyles(ColorScheme.Black, true),
};

// Create context for supplying the theming information
export const ColorSchemeContext = React.createContext(themes.dark);

/**
 * This provider contains the logic for settings the right theme on the ColorSchemeContext.
 */
export function ColorSchemeProvider({ children }: PropsWithChildren<{}>) {
    const systemScheme = useColorScheme();
    const highContrast = useAccessibilitySetting('darkerSystemColors');
    const userScheme = useTypedSelector((state) => state.settings.colorScheme);
    const scheme = userScheme === ColorScheme.System ? systemScheme : userScheme;
    const theme = highContrast
        ? themes[`${scheme || 'light'}-highcontrast`]
        : themes[scheme || 'light'];

    return (
        <ColorSchemeContext.Provider value={theme}>
            {children}
        </ColorSchemeContext.Provider>
    );
}

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
    const systemScheme = useColorScheme();
    const userScheme = useTypedSelector((state) => state.settings.colorScheme);
    const scheme = userScheme === ColorScheme.System ? systemScheme : userScheme;
    let backgroundColor = '#f6f6f6fb';
    let useBlur = Platform.OS === 'ios';

    switch (scheme) {
        case 'dark':
            backgroundColor = '#333333fb';
            break;
        case 'black':
            backgroundColor = '#000000';
            // Prevent blurring on black theme
            useBlur = false;
            break;
    }

    if (useBlur) {
        return  <BlurView
            {...props}
            blurType={Platform.OS === 'ios' && majorPlatformVersion >= 13 
                ? scheme === 'dark' ? 'materialDark' : 'materialLight'
                : scheme === 'dark' ? 'extraDark' : 'xlight'
            } 
        />;
    }

    return <View {...props} style={[ props.style, {backgroundColor: backgroundColor} ]} />;
}