import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';

export function getSeconds(seconds: number): string {
    'worklet';
    return Math.floor(seconds % 60).toString().padStart(2, '0');
}

export function getMinutes(seconds: number): number {
    'worklet';
    return Math.floor(seconds / 60);
}

export function calculateProgressTranslation(
    position: number,
    reference: number,
    width: number,
) {
    'worklet';
    const completion = position / reference;

    // GUARD: Check whether the calculated number is valid and not infinite
    if (Number.isNaN(completion) || !Number.isFinite(completion) || !width) {
        return -1_000;
    }

    const output = (1 - completion) * -1 * width;

    return output;
}

// Progress track did not show up on Lyrics screen if min height is not set
export const ProgressTrackContainer = styled.View`
    overflow: hidden;
    height: 5px;
    flex: 1;
    flex-direction: row;
    align-items: center;
    position: relative;
    border-radius: 6px;
    min-height: 5px;
`;

export interface ProgressTrackProps {
    opacity?: number;
    stroke?: number;
}

const ProgressTrack = styled(Animated.View)<ProgressTrackProps>`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${(props) => props.stroke ? props.stroke + 'px' : '100%'};
    opacity: ${(props) => props.opacity || 1};
    border-radius: 99px;
`;

export default ProgressTrack;