# Jellyfin Audio Player
![Fastlane](https://github.com/leinelissen/jellyfin-audio-player/workflows/Fastlane/badge.svg)
![MIT License](https://img.shields.io/github/license/leinelissen/jellyfin-audio-player)

This is a [React Native](https://reactnative.dev/)-based audio streaming app for [Jellyfin](https://jellyfin.org/). Jellyfin is a community-based piece of software that allows you to stream your media library over the internet. By means of React Native, Jellyfin Audio Player allows you to stream your Jellyfin Music library, with full support for background audio and casting (ie. Airplay and Chromecast).

## ❗️Now open for beta testing on iOS
Please follow this link to enroll for the TestFlight beta release of Jellyfin Audio Player: https://testflight.apple.com/join/cf2AMDpx.

|![](./docs/images/now-playing.png)|![](./docs/images/recent-albums.png)|![](./docs/images/album-list.png)|![](./docs/images/search.png)|
|-|-|-|-|

## Features
* Sorting by recent albums
* Browsing through all available albums
* Searching based on album and artist names
* Queuing tracks and albums
* AirPlay and Chromecast support
* Background audio
* Native Dark Mode

### Features being considered
* Downloading music for offline playback
* Searching based on track names
* Looping and shuffling queue

## Getting Started
This piece of software is in alpha. I am working on getting this app in ~~TestFlight and~~ Google Play Developer Console, but this is contingent on keys being available. In the meantime, IPAs and APK are intermittenly released on the [Releases page](https://github.com/leinelissen/jellyfin-audio-player/releases). Alternatively, you can build this app from source using the build instructions.

### Using the app
You will need to setup your Jellyfin account for the application to be able to pull in all your audio. To do this, go over to the "Settings" tab and click the "Set Jellyfin server"-button. A modal will pop up in which you will enter your Jellyfin server url, after which you enter your credentials in the provided browser view. When the app detects your credentials, they will automatically be remembered for the future.

## Building from source
### Prerequisites
This project is built on React Native, and first of all requires [NodeJS](https://nodejs.org/en/) to be installed. After installing it and cloning this repository, don't forget ton run `npm install` on your command line, so that all Node dependencies are installed.

#### iOS Prerequisites
[XCode](https://developer.apple.com/download/) is required to build the iOS application. It also comes bundles with iOS simulators which make development exceedingly easy. This does mean that iOS development is limited to macs.

#### Android prerequisites
[Android Studio](https://developer.android.com/studio/install) is recommended for development as it includes the Android SDK as well as Android Simulators for devleopment. At the very least, installing the Android SDK is neccessary for building any version of the app.

### Development Build
As soon as all prerequisites are covered, you can start development in either iOS or Android simulators by running the following
```
npm run ios
npm run android
```

### Production Build
This project is configured using [Fastlane](https://docs.fastlane.tools/), which allows for easy IPA and APK generation. To get started with this, make sure you install Fastlane first either using bundler (see below), or alternatively via e.g. Homebrew ([see supported methods](https://docs.fastlane.tools/getting-started/ios/setup/)).
```
gem install bundler
bundle install -j 6
```
When fastlane is setup, you can run either commands for generating IPA (iOS) or APK (Android) bundles.
```
fastlane ios beta
fastlane android beta
```

## Licensing and Credits
This work is licensed under the MIT license and was built by Lei Nelissen.