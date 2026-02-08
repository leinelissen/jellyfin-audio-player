import React, { useState, useCallback } from 'react';
import { Button, View } from 'react-native';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { setCredentials } from '@/store/settings/db';
import { useNavigation, StackActions } from '@react-navigation/native';
import CredentialGenerator from './components/CredentialGenerator';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import { Text } from '@/components/Typography';


export default function SetJellyfinServer() {
    const defaultStyles = useDefaultStyles();
    // State for first screen
    const [serverUrl, setServerUrl] = useState<string>();
    const [isLogginIn, setIsLogginIn] = useState<boolean>(false);

    // Handlers needed for dispatching stuff
    const navigation = useNavigation();

    // Save creedentials to store and close the modal
    const saveCredentials = useCallback((credentials?: { uri: string; user_id: string; access_token: string; device_id: string; type: 'jellyfin' | 'emby' }) => {
        if (credentials) {
            setCredentials(credentials);
            navigation.dispatch(StackActions.popToTop());
        }
    }, [navigation]);

    return (
        <Modal>
            {isLogginIn ? (
                <CredentialGenerator 
                    serverUrl={serverUrl as string}
                    onCredentialsRetrieved={saveCredentials}
                />
            ) : (
                <View style={{ padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>
                        {t('set-server-instruction')}
                    </Text>
                    <Input
                        placeholder="https://jellyfin.yourserver.io/"
                        onChangeText={setServerUrl}
                        value={serverUrl} 
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[ defaultStyles.input, { width: '100%' } ]}
                    />
                    <Button
                        title={t('set-server')}
                        onPress={() => setIsLogginIn(true)}
                        disabled={!serverUrl?.length} 
                        color={defaultStyles.themeColor.color}
                    />
                </View>
            )}
        </Modal>
    );
}