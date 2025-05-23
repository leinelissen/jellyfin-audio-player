import React, { useCallback, useState } from 'react';
import styled from 'styled-components/native';
import { ALPHABET_LETTERS } from '@/CONSTANTS';
import { View, LayoutChangeEvent } from 'react-native';
import { 
    PanGestureHandler, 
    PanGestureHandlerGestureEvent, 
    TapGestureHandler, 
    TapGestureHandlerGestureEvent 
} from 'react-native-gesture-handler';
import useDefaultStyles from './Colors';
import { useNavigationOffsets } from './SafeNavigatorView';

// interface LetterContainerProps {
//     onPress: (letter: string) => void;
//     letter: string;
// }

const Container = styled.View`
    position: absolute;
    right: 0;
    z-index: 10;
    margin: auto 0;
    justify-content: center;
    align-items: center;
`;

const Letter = styled.Text<{ isSelected?: boolean }>`
    text-align: center;
    padding: 1.5px 10px;
    font-size: 12px;
`;

interface Props {
    onSelect: (selected: { index: number, letter: string }) => void;
}

/**
 * A generic component that introduces a scrolling bar on the right side of the
 * screen with all letters of the Alphabet.
 */
const AlphabetScroller: React.FC<Props> = ({ onSelect }) => {
    const styles = useDefaultStyles();
    const [ height, setHeight ] = useState(0);
    const [ index, setIndex ] = useState<number>();
    const { top, bottom } = useNavigationOffsets();

    // Handler for setting the correct height for a single alphabet item
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        setHeight(event.nativeEvent.layout.height);
    }, []);

    // Handler for passing on a new index when it is tapped or swiped
    const handleGestureEvent = useCallback((event: PanGestureHandlerGestureEvent | TapGestureHandlerGestureEvent) => {
        const { y } = event.nativeEvent;
        const newIndex = Math.min(
            Math.max(0, Math.floor(y / height)),
            ALPHABET_LETTERS.length - 1
        );

        if (newIndex !== index) {
            setIndex(newIndex);
            onSelect({ index: newIndex, letter: ALPHABET_LETTERS[newIndex] });
        }
    }, [height, index, onSelect]);

    return (
        <Container style={{ top, bottom }}>
            <TapGestureHandler onHandlerStateChange={handleGestureEvent}>
                <PanGestureHandler onGestureEvent={handleGestureEvent}>
                    <View>
                        {ALPHABET_LETTERS.split('').map((l, i) => (
                            <View
                                key={l}
                                onLayout={i === 0 ? handleLayout : undefined}
                            >
                                <Letter 
                                    style={styles.themeColor}
                                    isSelected={i === index}
                                >
                                    {l}
                                </Letter>
                            </View>
                        ))}
                    </View>
                </PanGestureHandler>              
            </TapGestureHandler>
        </Container>
    );
};

export default AlphabetScroller;
