import React, { useState, useCallback } from 'react';
import { Button, View } from 'react-native';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { setJellyfinCredentials } from '@/store/settings/actions';
import { useNavigation, StackActions } from '@react-navigation/native';
import CredentialGenerator from './components/CredentialGenerator';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import { Text } from '@/components/Typography';
import { AppState, useAppDispatch } from '@/store';
import { fetchRecentAlbums } from '@/store/music/actions';


export default function SetJellyfinServer() {
    const defaultStyles = useDefaultStyles();
    // State for first screen
    const [serverUrl, setServerUrl] = useState<string>();
    const [isLogginIn, setIsLogginIn] = useState<boolean>(false);

    // Handlers needed for dispatching stuff
    const dispatch = useAppDispatch();
    const navigation = useNavigation();

    // Save creedentials to store and close the modal
    const saveCredentials = useCallback((credentials: AppState['settings']['credentials']) => {
        if (credentials) {
            dispatch(setJellyfinCredentials(credentials));
            navigation.dispatch(StackActions.popToTop());
            dispatch(fetchRecentAlbums());
        }
    }, [navigation, dispatch]);

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