import React, { useCallback } from 'react';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { t } from '@/localisation';
import { RadioItem, RadioList } from '../components/Radio';
import { ColorScheme } from '@/store/settings/types';
import { updateAppSettings } from '@/store/settings/actions';
import { useAppSettings } from '@/store/settings/hooks';

export default function ColorSchemeSetting() {
    const { data: settings } = useAppSettings();
    const scheme = settings?.colorScheme || ColorScheme.System;

    const handlePress = useCallback((value: ColorScheme) => {
        updateAppSettings({ colorScheme: value });
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