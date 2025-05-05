import React, { useState } from 'react';
import styled from 'styled-components/native';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import { Dimensions } from 'react-native';
import { useUserOrSystemScheme } from '@/components/Colors';

const Screen = Dimensions.get('screen');
export const AlbumWidth = Screen.width / 2 - 24;
export const AlbumHeight = AlbumWidth + 40;
export const CoverSize = AlbumWidth - 16;

export const AlbumItem = styled.View`
    width: ${AlbumWidth}px;
    height: ${AlbumHeight}px;
    padding: 8px;
`;

const Container = styled(FastImage)`
    border-radius: 10px;
    width: ${CoverSize}px;
    height: ${CoverSize}px;
    margin-bottom: 5px;
`;

function AlbumImage(props: FastImageProps) {
    const [hasError, setError] = useState(false);
    const colorScheme = useUserOrSystemScheme();

    if (!props.source || hasError) {
        return (
            <Container
                {...props}
                source={colorScheme === 'light'
                    ? require('@/assets/images/empty-album-light.png')
                    : require('@/assets/images/empty-album-dark.png')
                }
            />
        );
    }

    return (
        <Container {...props} onError={() => setError(true)} />
    );
}

export default AlbumImage;