import React, { useCallback } from 'react';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { t } from '@/localisation';
import { RadioItem, RadioList } from '../components/Radio';
import { ColorScheme } from '@/store/settings/types';
import { useAppDispatch, useTypedSelector } from '@/store';
import { setColorScheme } from '@/store/settings/actions';

export default function ColorSchemeSetting() {
    const dispatch = useAppDispatch();
    const scheme = useTypedSelector((state) => state.settings.colorScheme);

    const handlePress = useCallback((value: ColorScheme) => {
        dispatch(setColorScheme(value));
    }, [dispatch]);

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