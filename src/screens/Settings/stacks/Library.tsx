import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import useDefaultStyles from '@/components/Colors';
import { NavigationProp } from '../..';
import { t } from '@/localisation';
import Button from '@/components/Button';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { InputContainer, Input } from '../components/Input';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';

export default function LibrarySettings() {
    const defaultStyles = useDefaultStyles();
    const { data: sourceData } = useLiveQuery(() => db.query.sources.findMany());
    const navigation = useNavigation<NavigationProp>();
    const handleSetLibrary = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);

    return (
        <Container>
            {sourceData?.map(source => (
                <>
                    <Paragraph key={source.id} style={defaultStyles.text}>{source.type}</Paragraph>
                    <InputContainer>
                        <Paragraph style={defaultStyles.text}>{t('server-url')}</Paragraph>
                        <Input placeholder="https://jellyfin.yourserver.com/" value={source.uri} editable={false} style={defaultStyles.input} />
                    </InputContainer>
                    <InputContainer>
                        <Paragraph style={defaultStyles.text}>{t('access-token')}</Paragraph>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={source.accessToken ?? undefined} editable={false} style={defaultStyles.input} />
                    </InputContainer>
                    <InputContainer>
                        <Paragraph style={defaultStyles.text}>{t('user-id')}</Paragraph>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={source.userId ?? undefined} editable={false} style={defaultStyles.input} />
                    </InputContainer>
                </>
            ))}
            <Button title={t('set-server')} onPress={handleSetLibrary} />
        </Container>
    );
}