import { StyleSheet, PlatformColor, DynamicColorIOS } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';

export const colors = StyleSheet.create({
    text: {
        color: PlatformColor('label'),
    },
    view: {
        backgroundColor: PlatformColor('systemBackground'),
    },
    border: {
        borderColor: PlatformColor('systemGray5Color'),
    },
    activeBackground: {
        backgroundColor: DynamicColorIOS({ light: `${THEME_COLOR}16`, dark: `${THEME_COLOR}66` })
    },
    imageBackground: {
        backgroundColor: PlatformColor('systemGray5Color')
    },
    modal: {
        backgroundColor: DynamicColorIOS({ light: '#eeeeeeee', dark: '#222222ee' })
    },
    input: {
        backgroundColor: PlatformColor('systemGray5Color'),
    }
});