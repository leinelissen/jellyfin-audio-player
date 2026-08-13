import { Paragraph } from '@/components/Typography';
import React, { useCallback } from 'react';
import { Switch } from 'react-native';
import { t } from '@/localisation';
import Settings from '@/store/settings/manager';
import Container from '../components/Container';
import { SwitchContainer, SwitchLabel } from '../components/Switch';
import { useAppSettings } from '@/store/settings/hooks';

export default function PlaybackReporting() {
    const { data: settings } = useAppSettings();
    const isEnabled = settings?.enablePlaybackReporting ?? true;

    const toggleSwitch = useCallback(() => {
        Settings.update({ enablePlaybackReporting: !isEnabled });
    }, [isEnabled]);

    return (
        <Container>
            <Paragraph>{t('playback-reporting-description')}</Paragraph>
            <SwitchContainer>
                <SwitchLabel>{t('playback-reporting')}</SwitchLabel>
                <Switch value={isEnabled} onValueChange={toggleSwitch} />
            </SwitchContainer>
        </Container>
    );
}
