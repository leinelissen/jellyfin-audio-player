import useDefaultStyles from "@/components/Colors";
import { ColorScheme } from "@/store/settings/types";
import { StyleSheet } from "react-native";

export function generateTimerStyles() {
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
        }
    })
}