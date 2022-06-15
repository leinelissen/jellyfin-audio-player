import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './src/components/App';
import { name as appName } from './app.json';
import PlaybackService from './src/utility/PlaybackService';
import { setupSentry } from 'utility/Sentry';
import { enableScreens } from 'react-native-screens';
import { patchTrackPlayer } from 'utility/AddedTrackEvents';

LogBox.ignoreLogs([
    'ViewPropTypes will be removed from React Native',
]);

setupSentry();
enableScreens();
patchTrackPlayer();
AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);