import React, { useEffect, useMemo, useRef } from 'react';
import CloudIcon from '@/assets/icons/cloud.svg';
import CloudDownArrow from '@/assets/icons/cloud-down-arrow.svg';
import CloudExclamationMarkIcon from '@/assets/icons/cloud-exclamation-mark.svg';
import InternalDriveIcon from '@/assets/icons/internal-drive.svg';
import useDefaultStyles from './Colors';
import Svg, { Circle, CircleProps } from 'react-native-svg';
import { Animated, Easing, ViewProps } from 'react-native';
import styled from 'styled-components/native';
import type { Download } from '@/store/downloads/types';
import { useDownload } from '@/store/downloads/hooks';

interface DownloadIconProps {
    trackId?: string;
    download?: Download | null;
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

function DownloadIcon({ trackId, download: downloadProp, size = 16, fill, style }: DownloadIconProps) {
    const defaultStyles = useDefaultStyles();
    const iconFill = fill || defaultStyles.textQuarterOpacity.color;

    const { data: downloadData } = useDownload(trackId || '');
    const download = downloadProp || downloadData || null;

    const isQueued = download && !download.isComplete && !download.isFailed;
    const radius = useMemo(() => size / 2, [size]);
    const circumference = useMemo(() => radius * 2 * Math.PI, [radius]);

    const circleRef = useRef<Circle>(null);
    const offsetAnimation = useRef(new Animated.Value(download?.progress || 0)).current;

    useEffect(() => {
        Animated.timing(offsetAnimation, {
            toValue: (circumference * (1 - (download?.progress || 0))),
            duration: 250,
            useNativeDriver: false,
            easing: Easing.ease,
        }).start();
    }, [download?.progress, offsetAnimation, circumference]);

    useEffect(() => {
        const subscription = offsetAnimation.addListener((offset) => {
            const setNativeProps = circleRef.current?.setNativeProps as (props: CircleProps) => void | undefined;
            setNativeProps?.({ strokeDashoffset: offset.value });
        });

        return () => offsetAnimation.removeListener(subscription);
    }, [offsetAnimation]);

    if (!download && !isQueued) {
        return (
            <CloudIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (download?.isComplete) {
        return (
            <InternalDriveIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (download?.isFailed) {
        return (
            <CloudExclamationMarkIcon width={size} height={size} fill={iconFill} style={style} />
        );
    }

    if (isQueued || (!download?.isFailed && !download?.isComplete)) {
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
