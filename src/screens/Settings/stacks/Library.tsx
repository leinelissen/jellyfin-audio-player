import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import useDefaultStyles from '@/components/Colors';
import { NavigationProp } from '../..';
import { t } from '@/localisation';
import Button from '@/components/Button';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { InputContainer, Input } from '../components/Input';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { sources } from '@/store/db/schema/sources';

export default function LibrarySettings() {
    const defaultStyles = useDefaultStyles();
    const { data: sourceData } = useLiveQuery(db.select().from(sources).limit(1));
    const credentials = sourceData?.[0] ? {
        uri: sourceData[0].uri,
        accessToken: sourceData[0].accessToken || '',
        userId: sourceData[0].userId || '',
    } : undefined;
    const navigation = useNavigation<NavigationProp>();
    const handleSetLibrary = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);

    return (
        <Container>
            <InputContainer>
                <Paragraph style={defaultStyles.text}>{t('server-url')}</Paragraph>
                <Input placeholder="https://jellyfin.yourserver.com/" value={credentials?.uri} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <InputContainer>
                <Paragraph style={defaultStyles.text}>{t('access-token')}</Paragraph>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={credentials?.accessToken} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <InputContainer>
                <Paragraph style={defaultStyles.text}>{t('user-id')}</Paragraph>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={credentials?.userId} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <Button title={t('set-server')} onPress={handleSetLibrary} />
        </Container>
    );
}