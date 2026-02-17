import { BlurView, BlurViewProps } from '@sbaiahmed1/react-native-blur';
import React, { PropsWithChildren } from 'react';
import { useContext } from 'react';
import { ColorSchemeName, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { ColorScheme } from '@/store/settings/types';
import { useAccessibilitySetting } from 'react-native-accessibility-settings';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import appSettings from '@/store/settings/entity';
import { eq } from 'drizzle-orm';

const majorPlatformVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

/**
 * Function for generating both the dark and light stylesheets, so that they
 * don't have to be generate on every individual component render
 */
function generateStyles(scheme: ColorSchemeName, highContrast: boolean) {
    return StyleSheet.create({
        text: {
            color: scheme === 'dark' ? '#fff' : '#000',
            fontSize: 14,
            fontFamily: 'Inter',
        },
        textSmall: {
            color: scheme === 'dark' ? '#fff' : '#000',
            fontSize: 12,
            lineHeight: 20,
            opacity: 0.5,
        },
        textHalfOpacity: {
            color: highContrast
                ? (scheme === 'dark' ? '#ffffffbb' : '#000000bb')
                : (scheme === 'dark' ? '#ffffff88' : '#00000088'),
            fontSize: 14,
        },
        textQuarterOpacity: {
            color: highContrast
                ? (scheme === 'dark' ? '#ffffff88' : '#00000088')
                : (scheme === 'dark' ? '#ffffff44' : '#00000044'),
            fontSize: 14,
        },
        view: {
            backgroundColor: scheme === 'dark' ? '#111111' : '#ffffff',
        },
        border: {
            borderColor: scheme === 'dark' ? '#262626' : '#ddd',
        },
        activeBackground: {
            backgroundColor: highContrast 
                ? `#8b513c${scheme === 'dark' ? '26' : '10'}`
                : `#FF3C00${scheme === 'dark' ? '26' : '16'}`,
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
            backgroundColor: highContrast
                ? (scheme === 'dark' ? '#ffffff0f' : '#0000000f')
                : (scheme === 'dark' ? '#ffffff09' : '#00000009'),
        },
        input: {
            backgroundColor: scheme === 'dark' ? '#191919' : '#f3f3f3',
            color: scheme === 'dark' ? '#fff' : '#000',
        },
        trackBackground: {
            backgroundColor: scheme === 'dark' ? '#161616' : '#fff',
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
        themeColor: {
            color: highContrast 
                ? scheme === 'dark' ? '#FF7A1C' : '#c93400'
                : '#FF3C00',
        },
        themeColorHalfOpacity: {
            color: highContrast 
                ? scheme === 'dark' ? '#FF7A1Cbb' : '#c93400bb'
                : '#FF3C0088',
        },
        themeColorQuarterOpacity: {
            color: highContrast 
                ? scheme === 'dark' ? '#FF7A1C88' : '#c9340088'
                : '#FF3C0044',
        },
        themeBackground: {
            backgroundColor: highContrast 
                ? scheme === 'dark' ? '#FF7A1C' : '#c93400'
                : '#FF3C00',
        }
    });
}

// Prerender both stylesheets
export const themes: Record<'dark' | 'light' | 'dark-highcontrast' | 'light-highcontrast', ReturnType<typeof generateStyles>> = {
    'dark': generateStyles('dark', false),
    'light': generateStyles('light', false),
    'dark-highcontrast': generateStyles('dark', true),
    'light-highcontrast': generateStyles('light', true),
};

// Create context for supplying the theming information
export const ColorSchemeContext = React.createContext(themes.dark);

/**
 * This hook returns the proper color scheme, taking into account potential user overrides.
 */
export function useUserOrSystemScheme() {
    const systemScheme = useColorScheme();
    const { data: settings } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    const userScheme = settings?.[0]?.colorScheme || ColorScheme.System;
    return userScheme === ColorScheme.System ? systemScheme : userScheme;
}

/**
 * This provider contains the logic for settings the right theme on the ColorSchemeContext.
 */
export function ColorSchemeProvider({ children }: PropsWithChildren<{}>) {
    const highContrast = useAccessibilitySetting('darkerSystemColors');
    const scheme = useUserOrSystemScheme();
    const normalizedScheme = (scheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const theme = highContrast
        ? themes[`${normalizedScheme}-highcontrast` as keyof typeof themes]
        : themes[normalizedScheme];

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
    children: (defaultStyles: ReturnType<typeof useDefaultStyles>) => React.JSX.Element;
}

/**
 * A render props component to supply the defaultStyles object.
 */
export function DefaultStylesProvider(props: DefaultStylesProviderProps) {
    const defaultStyles = useDefaultStyles();

    return props.children(defaultStyles);
}

export function ColoredBlurView({ children, style, ...props }: PropsWithChildren<BlurViewProps>) {
    const scheme = useUserOrSystemScheme();

    return Platform.OS === 'ios' ? (
        <View style={[style, { overflow: 'hidden' }]}>
            <BlurView
                style={[ StyleSheet.absoluteFill, { overflow: 'hidden'} ]}
                {...props}
                blurType={Platform.OS === 'ios' && majorPlatformVersion >= 13 
                    ? scheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'
                    : scheme === 'dark' ? 'extraDark' : 'xlight'
                }
            />
            {children}
        </View>
    ) : (
        <View {...props} style={[ style, {
            backgroundColor: scheme === 'light' ? '#f6f6f6fb' : '#333333fb',
        } ]}>
            {children}
        </View>
    );
}