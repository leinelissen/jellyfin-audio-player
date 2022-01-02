import React, { useEffect, useMemo, useRef } from 'react';
import { useTypedSelector } from 'store';
import CloudIcon from 'assets/cloud.svg';
import CloudExclamationMarkIcon from 'assets/cloud-exclamation-mark.svg';
import InternalDriveIcon from 'assets/internal-drive.svg';
import useDefaultStyles from './Colors';
import { EntityId } from '@reduxjs/toolkit';
import Svg, { Circle, CircleProps } from 'react-native-svg';
import { Animated, Easing } from 'react-native';

interface DownloadIconProps {
    trackId: EntityId;
    size?: number;
    fill?: string;
}

function DownloadIcon({ trackId, size = 16, fill }: DownloadIconProps) {
    // determine styles
    const defaultStyles = useDefaultStyles();
    const iconFill = fill || defaultStyles.textHalfOpacity.color;

    // Get download icon from state
    const entity = useTypedSelector((state) => state.downloads.entities[trackId]);

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
            // @ts-expect-error undocumented functionality
            const setNativeProps = circleRef.current?.setNativeProps as (props: CircleProps) => void | undefined;
            setNativeProps?.({ strokeDashoffset: offset.value });
        });

        return () => offsetAnimation.removeListener(subscription);
    }, [offsetAnimation]);

    if (!entity) {
        return (
            <CloudIcon width={size} height={size} fill={iconFill} />
        );
    }

    const { isComplete, isFailed } = entity;

    if (isComplete) {
        return (
            <InternalDriveIcon width={size} height={size} fill={iconFill} />
        );
    }

    if (isFailed) {
        return (
            <CloudExclamationMarkIcon width={size} height={size} fill={iconFill} />
        );
    }

    if (!isComplete && !isFailed) {
        return (
            <Svg width={size} height={size} transform={[{ rotate: '-90deg' }]}>
                <Circle
                    cx={radius}
                    cy={radius}
                    r={radius - 1}
                    stroke={iconFill}
                    // @ts-expect-error react-native-svg has outdated react-native typings
                    ref={circleRef}
                    strokeWidth={1.5}
                    strokeDasharray={[ circumference, circumference ]}
                    strokeDashoffset={circumference}
                    strokeLinecap='round'
                    fill='transparent'
                />
            </Svg>
        );
    }

    return null;
}

export default DownloadIcon;
