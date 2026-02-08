import { Paragraph } from '@/components/Typography';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { t } from '@/localisation';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { appSettings } from '@/store/db/schema/app-settings';
import { eq } from 'drizzle-orm';
import { setEnablePlaybackReporting } from '@/store/settings/db';
import Container from '../components/Container';
import { SwitchContainer, SwitchLabel } from '../components/Switch';

export default function PlaybackReporting() {
    const { data: settings } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    const isEnabled = settings?.[0]?.enablePlaybackReporting ?? true;

    const toggleSwitch = useCallback(() => {
        setEnablePlaybackReporting(!isEnabled);
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