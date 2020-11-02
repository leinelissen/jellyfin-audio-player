import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Text, Button } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';
import { SubHeader } from 'components/Typography';
import { colors } from 'components/Colors';
import { NavigationProp } from '../..';
import { useTypedSelector } from 'store';
import { t } from '@localisation';

const InputContainer = styled.View`
    margin: 10px 0;
`;

const Input = styled.TextInput`
    padding: 15px;
    margin-top: 5px;
    border-radius: 5px;
`;

export default function LibrarySettings() {
    const { jellyfin } = useTypedSelector(state => state.settings);
    const navigation = useNavigation<NavigationProp>();
    const handleSetLibrary = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);

    return (
        <>
            <SubHeader>{t('jellyfin-library')}</SubHeader>
            <InputContainer>
                <Text style={colors.text}>{t('jellyfin-server-url')}</Text>
                <Input placeholder="https://jellyfin.yourserver.com/" value={jellyfin?.uri} editable={false} style={colors.input} />
            </InputContainer>
            <InputContainer>
                <Text style={colors.text}>{t('jellyfin-access-token')}</Text>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.access_token} editable={false} style={colors.input} />
            </InputContainer>
            <InputContainer>
                <Text style={colors.text}>{t('jellyfin-user-id')}</Text>
                <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.user_id} editable={false} style={colors.input} />
            </InputContainer>
            <Button title={t('set-jellyfin-server')} onPress={handleSetLibrary} color={THEME_COLOR} />
        </>
    );
}