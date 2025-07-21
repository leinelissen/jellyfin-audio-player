import React, { useMemo } from 'react';
import { Dimensions, View, ViewProps } from 'react-native';
import { Canvas, Blur, Image as SkiaImage, useImage, Offset, Mask, RoundedRect, Shadow } from '@shopify/react-native-skia';
import useDefaultStyles, { useUserOrSystemScheme } from './Colors';
import styled from 'styled-components/native';

const Screen = Dimensions.get('screen');

const Container = styled.View<{ size: number }>`
    width: ${(props) => props.size}px;
    height: ${(props) => props.size}px;
    position: relative;
    z-index: 0;
`;

const BlurContainer = styled(Canvas) <{ size: number, offset: number }>`
    position: absolute;
    left: -${(props) => props.offset}px;
    top: -${(props) => props.offset}px;
    width: ${(props) => props.size}px;
    height: ${(props) => props.size}px;
    z-index: 2;
`;

interface Props {
    blurRadius?: number;
    opacity?: number;
    margin?: number;
    radius?: number;
    style?: ViewProps['style'];
    src?: string;
}

const emptyAlbumLight = require('@/assets/images/empty-album-light.png');
const emptyAlbumDark = require('@/assets/images/empty-album-dark.png');

/**
 * This will take a cover image, and apply shadows and a really nice background
 * blur to the image in question. Additionally, we'll add some margin and radius
 * to the corners.
 */
const CoverImage = React.memo(function CoverImage({
    blurRadius = 256,
    opacity = 0.85,
    margin = 112,
    radius = 12,
    style,
    src,
}: Props) {
    const defaultStyles = useDefaultStyles();
    const colorScheme = useUserOrSystemScheme();

    const image = useImage(src || null);
    const fallback = useImage(colorScheme === 'light' ? emptyAlbumLight : emptyAlbumDark);
    const { canvasSize, imageSize } = useMemo(() => {
        const imageSize = Screen.width - margin;
        const canvasSize = imageSize + blurRadius * 2;
        return { imageSize, canvasSize };
    }, [blurRadius, margin]);

    return (
        <View shouldRasterizeIOS={true} renderToHardwareTextureAndroid={true}>
        <Container size={imageSize} style={style}>
            <BlurContainer size={canvasSize} offset={blurRadius}>
                <RoundedRect x={blurRadius} y={blurRadius} width={imageSize} height={imageSize} color={defaultStyles.imageBackground.backgroundColor} r={12}>
                    <Shadow dx={0} dy={1} blur={2} color="#0000000d" />
                    <Shadow dx={0} dy={2} blur={4} color="#0000000d" />
                    <Shadow dx={0} dy={4} blur={8} color="#0000000d" />
                    <Shadow dx={0} dy={8} blur={16} color="#0000000d" />
                    <Shadow dx={0} dy={16} blur={32} color="#0000000d" />
                </RoundedRect>
                {src ? (
                    <>
                        <SkiaImage
                            image={image}
                            width={imageSize}
                            height={imageSize}
                            opacity={opacity}
                            key="image-blur"
                        >
                            <Offset x={blurRadius} y={blurRadius} />
                            <Blur blur={blurRadius / 2} />
                        </SkiaImage>
                        <Mask
                            mask={
                                <RoundedRect
                                    width={imageSize}
                                    height={imageSize}
                                    x={blurRadius}
                                    y={blurRadius} r={radius}
                                />
                            }
                            key="image"
                        >
                            <SkiaImage image={image} width={imageSize} height={imageSize}>
                                <Offset x={blurRadius} y={blurRadius} />
                            </SkiaImage>
                        </Mask>
                    </>
                ) : (
                    <Mask
                        mask={
                            <RoundedRect
                                width={imageSize}
                                height={imageSize}
                                x={blurRadius}
                                y={blurRadius} r={radius}
                            />
                        }
                        key="fallback"
                    >
                        <SkiaImage image={fallback} width={imageSize} height={imageSize}>
                            <Offset x={blurRadius} y={blurRadius} />
                        </SkiaImage>
                    </Mask>
                )}
            </BlurContainer>
        </Container>
        </View>
    );
});

export default CoverImage;