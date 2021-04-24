import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './src/components/App';
import { name as appName } from './app.json';
import PlaybackService from './src/utility/PlaybackService';
import { setupSentry } from 'utility/Sentry';
import { enableScreens } from 'react-native-screens';

setupSentry();
enableScreens();
AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);