import React from 'react';
import { useTypedSelector } from 'store';
import CloudIcon from 'assets/cloud.svg';
import CloudExclamationMarkIcon from 'assets/cloud-exclamation-mark.svg';
import InternalDriveIcon from 'assets/internal-drive.svg';
import useDefaultStyles from './Colors';
import { EntityId } from '@reduxjs/toolkit';
import Svg, { Circle } from 'react-native-svg';

interface DownloadIconProps {
    trackId: EntityId;
    size?: number;
    fill?: string;
}

function DownloadIcon({ trackId, size = 16, fill }: DownloadIconProps) {
    const defaultStyles = useDefaultStyles();
    const entity = useTypedSelector((state) => state.downloads.entities[trackId]);
    const iconFill = fill || defaultStyles.textHalfOpacity.color;


    if (!entity) {
        return (
            <CloudIcon width={size} height={size} fill={iconFill} />
        );
    }

    const { isComplete, isFailed, progress } = entity;

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
        const radius = size / 2;
        const circumference = radius * 2 * Math.PI;

        return (
            <Svg width={size} height={size} transform={[{ rotate: '-90deg' }]}>
                <Circle
                    cx={radius}
                    cy={radius}
                    r={radius - 1}
                    stroke={iconFill}
                    strokeWidth={1.5}
                    strokeDasharray={[ circumference, circumference ]}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap='round'
                    fill='transparent'
                />
            </Svg>
        );
    }

    return null;
}

export default DownloadIcon;
