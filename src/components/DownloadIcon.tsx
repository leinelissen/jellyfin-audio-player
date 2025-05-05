import React, { useEffect, useMemo, useRef } from 'react';
import { useTypedSelector } from '@/store';
import CloudIcon from '@/assets/icons/cloud.svg';
import CloudDownArrow from '@/assets/icons/cloud-down-arrow.svg';
import CloudExclamationMarkIcon from '@/assets/icons/cloud-exclamation-mark.svg';
import InternalDriveIcon from '@/assets/icons/internal-drive.svg';
import useDefaultStyles from './Colors';
import Svg, { Circle, CircleProps } from 'react-native-svg';
import { Animated, Easing, ViewProps } from 'react-native';
import styled from 'styled-components/native';

interface DownloadIconProps {
    trackId: string;
    size?: number;
    fill?: string;
    style?: ViewProps['style'];
}

const DownloadContainer = styled.View`
    position: relative;
`;

const IconOverlay = styled.View`
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(0.5);
`;

function DownloadIcon({ trackId, size = 16, fill, style }: DownloadIconProps) {
    // determine styles
    const defaultStyles = useDefaultStyles();
    const iconFill = fill || defaultStyles.textQuarterOpacity.color;

    // Get download icon from state
    const entity = useTypedSelector((state) => state.downloads.entities[trackId]);
    const isQueued = useTypedSelector((state) => state.downloads.queued.includes(trackId));

    // Memoize calculations for radius and circumference of the circle
    const radius = useMemo(() => size / 2, [size]);
    const circumference = useMemo(() => radius * 2 * Math.PI, [radius]);

    // Initialize refs for the circle and the animated value
    const circleRef = useRef<Circle>(null);
    const offsetAnimation = useRef(new Animated.Value(entity?.progress || 0)).current;

    // Whenever the progress changes, trigger the animation
    useEffect(() => {
        Animated.timing(offsetAnimation, {
            toValue: (circumference * (1 - (entity?.progress || 0))),
            duration: 250,
            useNativeDriver: false,
            easing: Easing.ease,
        }).start();
    }, [entity?.progress, offsetAnimation, circumference]);

    // On mount, subscribe to changes in the animation value and then 
    // apply them to the circle using native props
    useEffect(() => {
        const subscription = offsetAnimation.addListener((offset) => {
            const setNativeProps = circleRef.current?.setNativeProps as (props: CircleProps) => void | undefined;
            setNativeProps?.({ strokeDashoffset: offset.value });
        });

        return () => offsetAnimation.removeListener(subscription);
    }, [offsetAnimation]);

    if (!entity && !isQueued) {
        return (
            <CloudIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (entity?.isComplete) {
        return (
            <InternalDriveIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (entity?.isFailed) {
        return (
            <CloudExclamationMarkIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (isQueued || (!entity?.isFailed && !entity?.isComplete)) {
        return (
            <DownloadContainer>
                <Svg width={size} height={size} transform={[{ rotate: '-90deg' }]}>
                    <Circle
                        cx={radius}
                        cy={radius}
                        r={radius - 1}
                        stroke={iconFill}
                        ref={circleRef}
                        strokeWidth={1.5}
                        strokeDasharray={[ circumference, circumference ]}
                        strokeDashoffset={circumference}
                        strokeLinecap='round'
                        fill='transparent'
                    />
                </Svg>
                <IconOverlay>
                    <CloudDownArrow width={size} height={size} fill={iconFill} style={style} />
                </IconOverlay>
            </DownloadContainer>
        );
    }

    return null;
}

export default DownloadIcon;
