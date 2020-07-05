// import React from 'react';
 
// // if (process.env.NODE_ENV === 'development') {
// //     const whyDidYouRender = require('@welldone-software/why-did-you-render');
// //     whyDidYouRender(React, {
// //         trackAllPureComponents: true,
// //     });
// // }

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './src/components/App';
import { name as appName } from './app.json';
import PlaybackService from './src/utility/PlaybackService';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);