import React, { useCallback } from 'react';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { t } from '@/localisation';
import { RadioItem, RadioList } from '../components/Radio';
import { ColorScheme } from '@/store/settings/types';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { appSettings } from '@/store/db/schema/app-settings';
import { eq } from 'drizzle-orm';
import { setColorScheme as setColorSchemeDb } from '@/store/settings/db';

export default function ColorSchemeSetting() {
    const { data: settings } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    const scheme = settings?.[0]?.colorScheme || ColorScheme.System;

    const handlePress = useCallback((value: ColorScheme) => {
        setColorSchemeDb(value);
    }, []);

    return (
        <Container>
            <Paragraph>{t('color-scheme-description')}</Paragraph>
            <Paragraph />
            <RadioList>
                <RadioItem
                    label={t('color-scheme-system')}
                    value={ColorScheme.System}
                    onPress={handlePress}
                    checked={scheme === ColorScheme.System}
                />
                <RadioItem
                    label={t('color-scheme-light')}
                    value={ColorScheme.Light}
                    onPress={handlePress}
                    checked={scheme === ColorScheme.Light}
                />
                <RadioItem
                    label={t('color-scheme-dark')}
                    value={ColorScheme.Dark}
                    onPress={handlePress}
                    checked={scheme === ColorScheme.Dark}
                    last
                />
            </RadioList>
        </Container>
    );
}