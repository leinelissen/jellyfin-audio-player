import useDefaultStyles from '@/components/Colors';
import { StyleSheet } from 'react-native';

export function useTimeStyles() {
    const styles = useDefaultStyles();

    return StyleSheet.create({
        ...styles,
        timer: {
            display: 'flex',
            flexDirection: 'row'
        },
        timeInput: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3
        },
        checkbox: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        timerSetting: {
            marginStart: 10
        },
        timerSettingsDisabled: {
            color: '#cbcbcb',
            marginStart: 10
        },
        showDateTime: {
            display: 'flex'
        },
        hideDateTime: {
            display: 'none'
        }
    });
}