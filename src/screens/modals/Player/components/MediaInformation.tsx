import { Text } from '@/components/Typography';
import useCurrentTrack from '@/utility/useCurrentTrack';
import React from 'react-native';
import WaveformIcon from '@/assets/icons/waveform.svg';
import useDefaultStyles from '@/components/Colors';
import styled, { css } from 'styled-components/native';
import { useMemo } from 'react';
import { t } from '@/localisation';
import type { TrackMediaStream } from '@/store/sources/types';

const Container = styled.View`
    flex-direction: row;
    gap: 8px;
    margin-top: 12px;
    margin-bottom: 16px;
`;

const Info = styled.View`
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
    flex-grow: 1;
    flex-shrink: 1;
`;

const Label = styled(Text)<{ $overflow?: boolean }>`
    opacity: 0.5;
    font-size: 13px;

    ${(props) => props?.$overflow ? css`
        flex: 0 1 auto;
    `: null}
`;

/**
 * This component displays information about the media that is being played
 * back, such as the bitrate, sample rate, codec and whether it's transcoded.
 */
export default function MediaInformation() {
    const styles = useDefaultStyles();
    const { track, albumTrack } = useCurrentTrack();

    const mediaStream = useMemo((): TrackMediaStream | undefined => (
        albumTrack?.metadata?.MediaStreams?.find((d) => d.Type === 'Audio')
    ), [albumTrack]);

    const codec = albumTrack?.metadata?.Codec;

    if (!albumTrack || !track) {
        return null;
    }

    return (
        <Container>
            <WaveformIcon fill={styles.icon.color} height={16} width={16} />
            <Info>
                <Label numberOfLines={1} $overflow>
                    {codec?.isDirectPlay ? t('direct-play') : t('transcoded')}
                </Label>
                <Label numberOfLines={1}>
                    {codec?.isDirectPlay
                        ? mediaStream?.Codec?.toUpperCase()
                        : codec?.contentType?.replace('audio/', '').toUpperCase()
                    }
                </Label>
                {mediaStream && (
                    <>
                        <Label numberOfLines={1}>
                            {(((codec?.isDirectPlay ? mediaStream.BitRate : track.bitRate) ?? 0) / 1000)
                                .toFixed(0)}
                            {t('kbps')}
                        </Label>
                        <Label numberOfLines={1}>
                            {((mediaStream.SampleRate ?? 0) / 1000).toFixed(1)}
                            {t('khz')}
                        </Label>
                    </>
                )}
            </Info>
        </Container>
    );
}