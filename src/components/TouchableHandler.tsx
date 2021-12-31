import React, { PropsWithChildren, useCallback } from 'react';
import { Pressable, ViewStyle } from 'react-native';

interface TouchableHandlerProps<T = number> {
    id: T;
    onPress: (id: T) => void;
    onLongPress?: (id: T) => void;
}

function TouchableStyles({ pressed }: { pressed: boolean }): ViewStyle {
    if (pressed) {
        return { opacity: 0.5 };
    } else {
        return { opacity: 1 };
    }
}

/**
 * This is a generic handler that accepts id as a prop, and return it when it is
 * pressed. This comes in handy with lists in which albums / tracks need to be selected.
 */
function TouchableHandler<T>({ 
    id,
    onPress,
    onLongPress,
    children
}: PropsWithChildren<TouchableHandlerProps<T>>): JSX.Element {
    const handlePress = useCallback(() => {
        return onPress(id);
    }, [id, onPress]);

    const handleLongPress = useCallback(() => {
        return onLongPress ? onLongPress(id) : undefined;
    }, [id, onLongPress]);

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={TouchableStyles}
        >
            {children}
        </Pressable>
    );
}

export default TouchableHandler;