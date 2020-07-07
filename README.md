# Jellyfin Audio Player
This is a React Native-based audio streaming app for Jellyfin.

|![](./docs/images/now-playing.png)|![](./docs/images/recent-albums.png)|![](./docs/images/album-list.png)|![](./docs/images/search.png)|
|-|-|-|-|

## Getting Started
What you want get started on depends on your intentions. As there is no build for general availability yet, you will need to build this project yourself.

### Using the app
You will need to setup your Jellyfin account for the application to be able to pull in all your audio. To do this, go over to the "Settings" tab and click the "Set Jellyfin server"-button. A modal will pop up in which you will enter your Jellyfin server url, after which you enter your credentials in the provided browser view. When the app detects your credentials, they will automatically be remembered by the app.

### Development Build
This app has been mainly developed for iOS, but should mostly function on Android as well. To get started, do the following:
1. Clone this repository
2. Install [NodeJS](https://nodejs.org/en/) and [XCode](https://developer.apple.com/download/)
3. `npm install`
4. `npm run ios`

### Production Build
Follow step 1-3 from the development build, then do the following:
```
npm run build:ios
```
Then open `ios/JellyfinAudioPlayer.xcworkspace` and build the project in XCode.