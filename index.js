import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './src/components/App';
import { name as appName } from './app.json';
import PlaybackService from './src/utility/PlaybackService';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
    });
}

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);