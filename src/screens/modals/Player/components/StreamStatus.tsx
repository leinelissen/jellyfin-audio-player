import React, { useMemo } from 'react';
import useCurrentTrack from '@/utility/useCurrentTrack';
import CloudIcon from 'assets/icons/cloud.svg';
import InternalDriveIcon from 'assets/icons/internal-drive.svg';
import useDefaultStyles from '@/components/Colors';
import { Text } from '@/components/Typography';
import styled from 'styled-components/native';
import Casting from './Casting';
import { t } from '@/localisation';

const ICON_SIZE = 16;

const Container = styled.View`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    margin-top: 24px;
`;

const Group = styled.View`
    display: flex;
    flex-direction: row;
    margin-right: 8px;
    flex: 1 1 auto;
`;

const Label = styled(Text)`
    margin-left: 8px;
    opacity: 0.5;
    font-size: 13px;
`;

function StreamStatus() {
    const { track } = useCurrentTrack();
    const defaultStyles = useDefaultStyles();

    const isLocalPlay = useMemo(() => {
        const url = track?.url;
        return typeof url === 'string' ? url.startsWith('file://') : false;
    }, [track?.url]);

    return (
        <Container>
            <Group>
                {isLocalPlay ? (
                    <>
                        <InternalDriveIcon width={ICON_SIZE} height={ICON_SIZE} fill={defaultStyles.icon.color} />
                        <Label numberOfLines={1}>{t('local-playback')}</Label>
                    </>
                ) : (
                    <>
                        <CloudIcon width={ICON_SIZE} height={ICON_SIZE} fill={defaultStyles.icon.color} />
                        <Label numberOfLines={1}>{t('streaming')}</Label>
                    </>
                )}
            </Group>
            <Casting />
        </Container>
    );
}

export default StreamStatus;
