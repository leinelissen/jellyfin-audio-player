import React, { useCallback, useState } from 'react';
import styled from 'styled-components/native';
import { ALPHABET_LETTERS, THEME_COLOR } from 'CONSTANTS';
import { View, LayoutChangeEvent } from 'react-native';
import { 
    PanGestureHandler, 
    PanGestureHandlerGestureEvent, 
    TapGestureHandler, 
    TapGestureHandlerGestureEvent 
} from 'react-native-gesture-handler';

interface LetterContainerProps {
    onPress: (letter: string) => void;
    letter: string;
}

const Container = styled.View`
    position: absolute;
    right: 5px;
    top: 0;
    height: 100%;
    z-index: 10;
    padding: 5px;
    margin: auto 0;
    justify-content: space-around;
`;

const Letter = styled.Text`
    text-align: center;
    padding: 1px 0;
    font-size: 12px;
    color: ${THEME_COLOR};
`;

interface Props {
    onSelect: (index: number) => void;
}

/**
 * A generic component that introduces a scrolling bar on the right side of the
 * screen with all letters of the Alphabet.
 */
const AlphabetScroller: React.FC<Props> = ({ onSelect }) => {
    const [ height, setHeight ] = useState(0);
    const [ index, setIndex ] = useState<number>();

    // Handler for setting the correct height for a single alphabet item
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        setHeight(event.nativeEvent.layout.height);
    }, []);

    // Handler for passing on a new index when it is tapped or swiped
    const handleGestureEvent = useCallback((event: PanGestureHandlerGestureEvent | TapGestureHandlerGestureEvent) => {
        const newIndex = Math.floor(event.nativeEvent.y / height);

        if (newIndex !== index) {
            setIndex(newIndex);
            onSelect(newIndex);
        }
    }, [height, index, onSelect]);

    return (
        <Container>
            <TapGestureHandler onHandlerStateChange={handleGestureEvent}>
                <PanGestureHandler onGestureEvent={handleGestureEvent}>
                    <View>
                        {ALPHABET_LETTERS.split('').map((l, i) => (
                            <View
                                key={l}
                                onLayout={i === 0 ? handleLayout : undefined}
                            >
                                <Letter>{l}</Letter>
                            </View>
                        ))}
                    </View>
                </PanGestureHandler>              
            </TapGestureHandler>
        </Container>
    );
};

export default AlphabetScroller;
