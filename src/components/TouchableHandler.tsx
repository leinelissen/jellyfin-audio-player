import React, { useCallback } from 'react';
import { Pressable, ViewStyle } from 'react-native';

interface TouchableHandlerProps {
    id: string;
    onPress: (id: string) => void;
    onLongPress?: (id: string) => void;
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
const TouchableHandler: React.FC<TouchableHandlerProps>  = ({ id, onPress, onLongPress, children }) => {
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
};

export default TouchableHandler;