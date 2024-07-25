import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import useDefaultStyles from '@/components/Colors';
import { NavigationProp } from '../..';
import { useTypedSelector } from '@/store';
import { t } from '@/localisation';
import Button from '@/components/Button';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { InputContainer, Input } from '../components/Input';

export default function LibrarySettings() {
    const defaultStyles = useDefaultStyles();
    const { credentials } = useTypedSelector(state => state.settings);
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
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={credentials?.access_token} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <InputContainer>
                <Paragraph style={defaultStyles.text}>{t('user-id')}</Paragraph>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={credentials?.user_id} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <Button title={t('set-server')} onPress={handleSetLibrary} />
        </Container>
    );
}