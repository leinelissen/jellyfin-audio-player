import React, { useCallback } from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
import { Picker } from '@react-native-community/picker';
import { ScrollView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { useSelector } from 'react-redux';
import { AppState } from 'store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '..';
import { THEME_COLOR } from 'CONSTANTS';

const InputContainer = styled.View`
    margin: 10px 0;
`;

const Input = styled.TextInput`
    background-color: #fbfbfb;
    padding: 15px;
    margin-top: 5px;
    border-radius: 5px;
`;

export default function Settings() {
    const { jellyfin, bitrate } = useSelector((state: AppState) => state.settings);
    const navigation = useNavigation<NavigationProp>();
    const handleClick = useCallback(() => navigation.navigate('SetJellyfinServer'), [navigation]);

    return (
        <ScrollView>
            <SafeAreaView>
                <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 36, marginBottom: 24, fontWeight: 'bold' }}>Settings</Text>
                    <InputContainer>
                        <Text>Jellyfin Server URL</Text>
                        <Input placeholder="https://jellyfin.yourserver.com/" value={jellyfin?.uri} editable={false} />
                    </InputContainer>
                    <InputContainer>
                        <Text>Jellyfin Access Token</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.access_token} editable={false} />
                    </InputContainer>
                    <InputContainer>
                        <Text>Jellyfin User ID</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.user_id} editable={false} />
                    </InputContainer>
                    <Button title="Set Jellyfin server" onPress={handleClick} color={THEME_COLOR} />
                    <InputContainer>
                        <Text>Bitrate</Text>
                        <Picker selectedValue={bitrate}>
                            <Picker.Item label="320kbps" value={140000000} />
                        </Picker>
                    </InputContainer>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}