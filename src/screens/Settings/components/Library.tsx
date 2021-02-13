import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import useDefaultStyles from 'components/Colors';
import { NavigationProp } from '../..';
import { useTypedSelector } from 'store';
import { t } from '@localisation';
import Button from 'components/Button';
import Text from 'components/Text';

const InputContainer = styled.View`
    margin: 10px 0;
`;

const Input = styled.TextInput`
    padding: 15px;
    margin-top: 5px;
    border-radius: 5px;
`;

const Container = styled.ScrollView`
    padding: 24px;
`;

export default function LibrarySettings() {
    const defaultStyles = useDefaultStyles();
    const { jellyfin } = useTypedSelector(state => state.settings);
    const navigation = useNavigation<NavigationProp>();
    const handleSetLibrary = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);

    return (
        <Container>
            <InputContainer>
                <Text style={defaultStyles.text}>{t('jellyfin-server-url')}</Text>
                <Input placeholder="https://jellyfin.yourserver.com/" value={jellyfin?.uri} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <InputContainer>
                <Text style={defaultStyles.text}>{t('jellyfin-access-token')}</Text>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.access_token} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <InputContainer>
                <Text style={defaultStyles.text}>{t('jellyfin-user-id')}</Text>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.user_id} editable={false} style={defaultStyles.input} />
            </InputContainer>
            <Button title={t('set-jellyfin-server')} onPress={handleSetLibrary} />
        </Container>
    );
}