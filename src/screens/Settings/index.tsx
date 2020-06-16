import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';

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
    

    return (
        <ScrollView>
            <SafeAreaView>
                <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 36, marginBottom: 24, fontWeight: 'bold' }}>Settings</Text>
                    <InputContainer>
                        <Text>Jellyfin Server URL</Text>
                        <Input placeholder="https://jellyfin.yourserver.com/" />
                    </InputContainer>
                    <InputContainer>
                        <Text>Jellyfin API Key</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" />
                    </InputContainer>
                    <InputContainer>
                        <Text>Jellyfin User ID</Text>
                        <Input placeholder="deadbeefdeadbeefdeadbeef" />
                    </InputContainer>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}