import { Text } from '@/components/Typography';
import { useTypedSelector } from '@/store';
import useCurrentTrack from '@/utility/useCurrentTrack';
import React from 'react-native';
import WaveformIcon from '@/assets/icons/waveform.svg';
import useDefaultStyles from '@/components/Colors';
import styled, { css } from 'styled-components/native';

const Container = styled.View`
    flex-direction: row;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 16px;
`;

const Info = styled.View`
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
    flex-grow: 1;
    flex-shrink: 1;
`;

const Label = styled(Text)<{ overflow?: boolean }>`
    opacity: 0.5;
    font-size: 13px;

    ${(props) => props?.overflow && css`
        flex: 0 1 auto;
    `}
`;

export default function MediaInformation() {
    const styles = useDefaultStyles();
    const { track } = useCurrentTrack();
    const { entities } = useTypedSelector((state) => state.music.tracks);

    if (!track) {
        return null;
    }

    const albumTrack = entities[track.backendId];
    const mediaStream = albumTrack.MediaStreams?.find((d) => d.Type === 'Audio');

    return (
        <Container>
            <WaveformIcon fill={styles.icon.color} height={16} width={16} />
            <Info>
                <Label numberOfLines={1} overflow>
                    {track.isDirectPlay ? 'Direct play' : 'Transcoded'}
                </Label>
                <Label numberOfLines={1} overflow>
                    {track.isDirectPlay
                        ? mediaStream?.Codec.toUpperCase()
                        : track.contentType?.replace('audio/', '').toUpperCase()
                    }
                </Label>
                {mediaStream && (
                    <>
                        <Label numberOfLines={1} overflow>
                            {((track.isDirectPlay ? mediaStream.BitRate : track.bitRate) / 1000).toFixed(0)}{'kbps'}</Label>
                        <Label numberOfLines={1} overflow>
                            {(mediaStream.SampleRate / 1000).toFixed(1)}{'kHz'}
                        </Label>
                    </>
                )}
            </Info>
        </Container>
    );
}