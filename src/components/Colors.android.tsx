import { StyleSheet, PlatformColor } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';

export const colors = StyleSheet.create({
    text: {
        color: PlatformColor('?attr/colorOnBackground'),
    },
    view: {
        backgroundColor: PlatformColor('?android:colorBackground'),
    },
    border: {
        borderColor: '#88888844'
    },
    activeBackground: {
        backgroundColor: `${THEME_COLOR}44`,
    },
    imageBackground: {
        backgroundColor: PlatformColor('?attr/colorBackgroundFloating'),
    },
    modal: {
        backgroundColor: PlatformColor('?attr/colorBackgroundFloating'),
    },
    input: {
        backgroundColor: PlatformColor('?attr/colorBackgroundFloating'),
    }
});