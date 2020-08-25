import React, { useCallback } from 'react';
import { View, Text, SafeAreaView, Button, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { useSelector } from 'react-redux';
import { AppState } from 'store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '..';
import { THEME_COLOR } from 'CONSTANTS';
import { Header } from 'components/Typography';
import { colors } from 'components/Colors';

const InputContainer = styled.View`
    margin: 10px 0;
`;

const Input = styled.TextInput`
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
                    <Header style={colors.text}>Settings</Header>
                    <InputContainer>
                        <Text style={colors.text}>Jellyfin Server URL</Text>
                        <Input placeholder="https://jellyfin.yourserver.com/" value={jellyfin?.uri} editable={false} style={colors.input} />
                    </InputContainer>
                    <InputContainer>
                        <Text style={colors.text}>Jellyfin Access Token</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.access_token} editable={false} style={colors.input} />
                    </InputContainer>
                    <InputContainer>
                        <Text style={colors.text}>Jellyfin User ID</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" value={jellyfin?.user_id} editable={false} style={colors.input} />
                    </InputContainer>
                    <Button title="Set Jellyfin server" onPress={handleClick} color={THEME_COLOR} />
                    {/* The bitrate setting is hidden for now, since Jellyfin does not appear to support custom bitrates */}
                    {/* <InputContainer>
                        <Text style={colors.text}>Bitrate</Text>
                        <Picker selectedValue={bitrate}>
                            <Picker.Item label="320kbps" value={140000000} />
                        </Picker>
                    </InputContainer> */}
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}