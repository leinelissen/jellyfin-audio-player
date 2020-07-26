import { StyleSheet, PlatformColor, Platform, DynamicColorIOS } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';

export const colors = StyleSheet.create({
    text: {
        ...Platform.select({
            ios: { 
                color: PlatformColor('label'),
            },
            android: { 
                color: PlatformColor('?android:attr/textColorPrimary'),
            }
        }),
    },
    view: {
        ...Platform.select({
            ios: { 
                backgroundColor: PlatformColor('systemBackground'),
            },
            android: { 
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    border: {
        ...Platform.select({
            ios: { 
                borderColor: PlatformColor('systemGray5Color'),
            },
            android: { 
                borderColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    activeBackground: {
        ...Platform.select({
            ios: { 
                backgroundColor: DynamicColorIOS({ light: `${THEME_COLOR}16`, dark: `${THEME_COLOR}66` })
            },
            android: { 
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    imageBackground: {
        ...Platform.select({
            ios: { 
                backgroundColor: PlatformColor('systemGray5Color')
            },
            android: { 
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    modal: {
        ...Platform.select({
            ios: { 
                backgroundColor: DynamicColorIOS({ light: '#eeeeeeee', dark: '#222222ee' })
            },
            android: { 
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    input: {
        ...Platform.select({
            ios: { 
                backgroundColor: PlatformColor('systemGray5Color'),
                color: PlatformColor('label'),
            },
            android: { 
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    }
});