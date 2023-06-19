import { Paragraph } from '@/components/Typography';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { t } from '@/localisation';
import { SafeScrollView } from '@/components/SafeNavigatorView';
import { useAppDispatch, useTypedSelector } from '@/store';
import { setEnablePlaybackReporting } from '@/store/settings/actions';
import Container from '../components/Container';
import { SwitchContainer, SwitchLabel } from '../components/Switch';

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
                    <SwitchLabel>{t('playback-reporting')}</SwitchLabel>
                    <Switch value={isEnabled} onValueChange={toggleSwitch} />
                </SwitchContainer>
            </Container>
        </SafeScrollView>
    );
}