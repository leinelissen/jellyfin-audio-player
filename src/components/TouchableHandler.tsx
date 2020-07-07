import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

interface TouchableHandlerProps {
    id: string;
    onPress: (id: string) => void;
}

/**
 * This is a generic handler that accepts id as a prop, and return it when it is
 * pressed. This comes in handy with lists in which albums / tracks need to be selected.
 */
const TouchableHandler: React.FC<TouchableHandlerProps>  = ({ id, onPress, children }) => {
    const handlePress = useCallback(() => {
        return onPress(id);
    }, [id, onPress]);

    return (
        <TouchableOpacity onPress={handlePress}>
            {children}
        </TouchableOpacity>
    );
};

export default TouchableHandler;