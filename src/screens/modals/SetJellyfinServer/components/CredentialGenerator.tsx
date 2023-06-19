import React, { Component, createRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { debounce } from 'lodash';
import { AppState } from '@/store';

interface Props {
    serverUrl: string;
    onCredentialsRetrieved: (credentials: AppState['settings']['jellyfin']) => void;
}

class CredentialGenerator extends Component<Props> {
    ref = createRef<WebView>();

    handleStateChange = () => {
        // Call a debounced version to check if the credentials are there
        this.checkIfCredentialsAreThere();
    };

    checkIfCredentialsAreThere = debounce(() => {
        // Inject some javascript to check if the credentials can be extracted
        // from localstore
        this.ref.current?.injectJavaScript(`
            try { 
                let credentials = JSON.parse(window.localStorage.getItem('jellyfin_credentials'));
                let deviceId = window.localStorage.getItem('_deviceId2');
                window.ReactNativeWebView.postMessage(JSON.stringify({ credentials, deviceId })) 
            } catch(e) { }; true;
        `);
    }, 500);

    handleMessage = (event: WebViewMessageEvent) => {
        // GUARD: Something must be returned for this thing to work
        if (!event.nativeEvent.data) {
            return;
        }

        // Parse the content
        const data = JSON.parse(event.nativeEvent.data);

        if (!data.deviceId 
            || !data.credentials?.Servers?.length 
            || !data.credentials?.Servers[0]?.UserId 
            || !data.credentials?.Servers[0]?.AccessToken) {
            return;
        }

        // If a message is received, the credentials should be there
        const { credentials: { Servers: [ credentials ] }, deviceId } = data;
        this.props.onCredentialsRetrieved({
            uri: credentials.ManualAddress,
            user_id: credentials.UserId,
            access_token: credentials.AccessToken,
            device_id: deviceId,
        });
    };

    render() {
        const { serverUrl } = this.props;

        return (
            <WebView
                source={{ uri: serverUrl as string }}
                onNavigationStateChange={this.handleStateChange}
                onMessage={this.handleMessage}
                ref={this.ref}
                startInLoadingState={true}
            />
        );
    }
}

export default CredentialGenerator;