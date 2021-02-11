import { THEME_COLOR } from 'CONSTANTS';
import { StyleSheet, useColorScheme } from 'react-native';

export default function useDefaultStyles() {
    const scheme = useColorScheme();
    // const scheme = 'dark';

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

interface DefaultStylesProviderProps {
    children: (defaultStyles: ReturnType<typeof useDefaultStyles>) => JSX.Element;
}

export function DefaultStylesProvider(props: DefaultStylesProviderProps) {
    const defaultStyles = useDefaultStyles();

    return props.children(defaultStyles);
}