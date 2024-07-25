import React, { Component, createRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { debounce } from 'lodash';
import { AppState } from '@/store';

interface Props {
    serverUrl: string;
    onCredentialsRetrieved: (credentials: AppState['settings']['credentials']) => void;
}

type CredentialEventData = {
    credentials: {
        Servers: {
            ManualAddress: string,
            ManualAddressOnly: boolean,
            IsLocalServer: boolean,
            DateLastAccessed: number,
            LastConnectionMode: number,
            Type: string,
            Name: string,
            Id: string,
            UserId: string | null,
            AccessToken: string | null,
            Users: {
                UserId: string,
                AccessToken: string,
            }[]
            LocalAddress: string,
            RemoteAddress: string,
        }[]
    },
    deviceId: string,
    type: 'emby',
} | {
    credentials: {
        Servers: {
            ManualAddress: string,
            manualAddressOnly: boolean,
            DateLastAccessed: number,
            LastConnectionMode: number,
            Name: string,
            Id: string,
            UserId: string | null,
            AccessToken: string | null,
            LocalAddress: string,
        }[]
    },
    deviceId: string,
    type: 'jellyfin',
} | undefined;

class CredentialGenerator extends Component<Props> {
    ref = createRef<WebView>();

    handleStateChange = () => {
        // Call a debounced version to check if the credentials are there
        this.checkIfCredentialsAreThere();
    };

    checkIfCredentialsAreThere = debounce(() => {
        // Inject some javascript to check if the credentials can be extracted
        // from localstore. We simultaneously attempt to extract credentials for
        // any back-end.
        this.ref.current?.injectJavaScript(`
            try { 
                let credentials = JSON.parse(window.localStorage.getItem('jellyfin_credentials'));
                let deviceId = window.localStorage.getItem('_deviceId2');
                window.ReactNativeWebView.postMessage(JSON.stringify({ credentials, deviceId, type: 'jellyfin' })) 
            } catch(e) { }; true;
            try {  
                let credentials = JSON.parse(window.localStorage.getItem('servercredentials3'));
                let deviceId = window.localStorage.getItem('_deviceId2');
                window.ReactNativeWebView.postMessage(JSON.stringify({ credentials, deviceId, type: 'emby' })) 
            } catch(e) { }; true;
        `);
    }, 500);

    handleMessage = async (event: WebViewMessageEvent) => {
        // GUARD: Something must be returned for this thing to work
        if (!event.nativeEvent.data) {
            return;
        }

        // Parse the content
        const data = JSON.parse(event.nativeEvent.data) as CredentialEventData;
        if (__DEV__) {
            console.log('Received credential event data: ', JSON.stringify(data));
        }

        // Since Jellyfin and Emby are similar, we'll attempt to extract the
        // credentials in a generic way.
        let userId: string | undefined, accessToken: string | undefined;

        // GUARD: Attempt to extract emby format credentials
        if (data?.type === 'emby'
            && data.credentials?.Servers?.length
            && data.credentials?.Servers[0]?.Users?.length
        ) {
            userId = data.credentials.Servers[0].Users[0].UserId;
            accessToken = data.credentials.Servers[0].Users[0].AccessToken;
        // GUARD: Attempt to extract jellyfin format credentials
        } else if (data?.type === 'jellyfin'
            && data.credentials?.Servers?.length
        ) {
            userId = data.credentials.Servers[0].UserId || undefined;
            accessToken = data.credentials.Servers[0].AccessToken || undefined;
        }

        // We can extract the deviceId and server address in the same way for
        // both Jellyfin and Emby.
        const deviceId = data?.deviceId;
        const address = data?.credentials?.Servers?.length
            && data?.credentials.Servers[0].ManualAddress;

        // GUARD: log extract credentials in dev
        if (__DEV__) {
            console.log('Extracted the following credentials:', { userId, accessToken, deviceId, address });
        }

        // GUARD: Check that all the required credentials are available
        if (!userId || !accessToken || !deviceId || !address) {
            if (__DEV__) {
                console.error('Failed to extract credentials from event');
            }
            return;
        }

        // Attempt to perform a request using the credentials to see if they're
        // good
        const response = await fetch(`${address}/Users/${userId}`, {
            headers: {
                'X-Emby-Authorization': `MediaBrowser Client="", Device="", DeviceId="", Version="", Token="${accessToken}"`
            }
        });

        // GUARD: The request must succeed
        if (response.status !== 200) {
            if (__DEV__) {
                const body = await response.text();
                console.error('Failed to retrieve user object using credentials:', response.status, body);
            }
            return;
        }

        // If a message is received, the credentials should be there
        this.props.onCredentialsRetrieved({
            uri: address,
            user_id: userId,
            access_token: accessToken,
            device_id: deviceId,
            type: data.type,
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