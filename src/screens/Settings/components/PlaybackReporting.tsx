import { Paragraph, Text } from 'components/Typography';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { t } from '@localisation';
import { SafeScrollView } from 'components/SafeNavigatorView';
import { useAppDispatch, useTypedSelector } from 'store';
import { setEnablePlaybackReporting } from 'store/settings/actions';

const Container = styled.View`
    padding: 24px;
`;

const SwitchContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
`;

const Label = styled(Text)`
    font-size: 16px;
`;

export default function PlaybackReporting() {
    const isEnabled = useTypedSelector((state) => state.settings.enablePlaybackReporting);
    const dispatch = useAppDispatch();

    const toggleSwitch = useCallback(() => {
        dispatch(setEnablePlaybackReporting(!isEnabled));
    }, [isEnabled, dispatch]);

    return (
        <SafeScrollView>
            <Container>
                <Paragraph>{t('playback-reporting-description')}</Paragraph>
                <SwitchContainer>
                    <Label>{t('playback-reporting')}</Label>
                    <Switch value={isEnabled} onValueChange={toggleSwitch} />
                </SwitchContainer>
            </Container>
        </SafeScrollView>
    );
}