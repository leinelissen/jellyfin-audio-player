# [2.3.0](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.2.0...v2.3.0) (2024-02-11)


### Bug Fixes

* add tslib dependency ([89a621a](https://github.com/leinelissen/jellyfin-audio-player/commit/89a621a86d8830f1b8d8ac38aec390a3cf5544ea))
* be more specific about which types can be played back directly ([227efad](https://github.com/leinelissen/jellyfin-audio-player/commit/227efad08d81b09525d194d677d1fbbb192f64be))
* disable autocorrect in search field ([92cd957](https://github.com/leinelissen/jellyfin-audio-player/commit/92cd95745d25ce8df3befd5dbd7c1bb5d140dc09))
* gemfile lock file ([5592d5c](https://github.com/leinelissen/jellyfin-audio-player/commit/5592d5c32f6df1b34caa4a1fef4f5204da768eec))
* icon spacing ([59b3700](https://github.com/leinelissen/jellyfin-audio-player/commit/59b370049f07a1faf7b72a249975fcc561b6f554))
* linter ([26198e5](https://github.com/leinelissen/jellyfin-audio-player/commit/26198e5fe6d7352783a8b6a4e211722d89dd3864))
* make some more room for download totals ([f95c79b](https://github.com/leinelissen/jellyfin-audio-player/commit/f95c79b2549356ef6b90c33ab2f197c048a23ca3)), closes [#193](https://github.com/leinelissen/jellyfin-audio-player/issues/193)
* move sleep-timer to separate reducer ([0f211b0](https://github.com/leinelissen/jellyfin-audio-player/commit/0f211b00b89ddf8f23227bf7ef0ad00d8031b9ed))
* package-lock ([6c59e93](https://github.com/leinelissen/jellyfin-audio-player/commit/6c59e932947a48fa3c74737e1c55adce61f9dcc4))
* prevent sentry from uploading sourcemaps in GitHub actions ([b257656](https://github.com/leinelissen/jellyfin-audio-player/commit/b257656ef925d4a361563a1f879ede5c4cc44c80))
* re-add events dependency ([0489e1a](https://github.com/leinelissen/jellyfin-audio-player/commit/0489e1a86ddef2fa311c72b0308e86979c722bae))
* re-enable sentry on ios build, fix react-native-flipper not building on ios ([1945cfd](https://github.com/leinelissen/jellyfin-audio-player/commit/1945cfd12cb1f60b6856b4eaecc1aaac75c8731e))
* refactor timer and design ([3bcd749](https://github.com/leinelissen/jellyfin-audio-player/commit/3bcd7496c2c98113b6f4d98afa4062cbf34469aa))
* remove fill from svg ([2d22a6f](https://github.com/leinelissen/jellyfin-audio-player/commit/2d22a6f6e3435006c66a97ea60ee8ac3100d8c0e))
* restore comma ([713b232](https://github.com/leinelissen/jellyfin-audio-player/commit/713b232289ed15a23c2ce4c3e7fd8360d561de0b))
* timer icon and resetting on cancel ([04ce9f2](https://github.com/leinelissen/jellyfin-audio-player/commit/04ce9f2979c3d374a0eb8875daa2140a677214f2))
* type errors ([6411bfb](https://github.com/leinelissen/jellyfin-audio-player/commit/6411bfbbb6ce27a5c070abb7c3342a33186af05b))
* unnecessary changes ([2d9b816](https://github.com/leinelissen/jellyfin-audio-player/commit/2d9b81651c3880b65ec2d83afa128513365259f4))
* update to react-native 0.71.15 so builds on ios work again ([3f60224](https://github.com/leinelissen/jellyfin-audio-player/commit/3f6022412172ecbe85399725e1a4a4ac6637c0c8))
* upgrade react-native-reanimated to fix typing issues ([34b3cd3](https://github.com/leinelissen/jellyfin-audio-player/commit/34b3cd3ba343406cf738724443da5f7be4ba0efe))
* use JVM v17 in GitHub actions ([8862d6b](https://github.com/leinelissen/jellyfin-audio-player/commit/8862d6b43582e73326b56527151e9ff616106d4e))


### Features

* add translations for sleep timer ([0f126d4](https://github.com/leinelissen/jellyfin-audio-player/commit/0f126d40ad8ea07f1f6b81e048e606805586f8a0))
* Added translation using Weblate (Bulgarian) ([73fc7a1](https://github.com/leinelissen/jellyfin-audio-player/commit/73fc7a1f0d1a62726c547730d7b67d9000402660))
* Added translation using Weblate (Catalan) ([b6b3e12](https://github.com/leinelissen/jellyfin-audio-player/commit/b6b3e12ec5fe7e4e652d32405a84ea83870d8d50))
* Added translation using Weblate (Czech) ([ce85503](https://github.com/leinelissen/jellyfin-audio-player/commit/ce8550300f5dca11a69ba482e66ada766d3aaed2))
* Added translation using Weblate (Danish) ([5c49197](https://github.com/leinelissen/jellyfin-audio-player/commit/5c4919797426b7c08438c41716a39d2b9cbb021b))
* Added translation using Weblate (Portuguese (Brazil)) ([1cdb98d](https://github.com/leinelissen/jellyfin-audio-player/commit/1cdb98d6422339c530a9106807841e947e38c395))
* Added translation using Weblate (Slovenian) ([4a2acd9](https://github.com/leinelissen/jellyfin-audio-player/commit/4a2acd9fdd9f3a8c6347084693d69f5446a6f346))
* enable de, ru, and sv as available languages ([6de1f97](https://github.com/leinelissen/jellyfin-audio-player/commit/6de1f97b7ff26a42e6ff44d5042b147053f76c65))
* introduce high contrast mode for ios ([82b4223](https://github.com/leinelissen/jellyfin-audio-player/commit/82b4223939f215a5799ba27ef029cbfa2637044c)), closes [#194](https://github.com/leinelissen/jellyfin-audio-player/issues/194)
* upgrade to react native 0.73 ([7cb4629](https://github.com/leinelissen/jellyfin-audio-player/commit/7cb4629b4a09e42a0b52aa5cc0ac64db4f38352f))



# [2.2.0](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.1.0...v2.2.0) (2023-07-14)


### Bug Fixes

* add getters for new locales ([f199789](https://github.com/leinelissen/jellyfin-audio-player/commit/f199789469d0b6c5610c9ddaea6f2f3fcbe963de))
* allow tapping search result directly without closing keyboard first ([a330824](https://github.com/leinelissen/jellyfin-audio-player/commit/a33082425b3b727edb9e6c8b85794260d330245f))
* also set itemid for first track in queue ([f540424](https://github.com/leinelissen/jellyfin-audio-player/commit/f540424edd788d96462ed30d872b80bf1581045d))
* Deleted translation using Weblate (English (United Kingdom)) ([d5e863f](https://github.com/leinelissen/jellyfin-audio-player/commit/d5e863fb8c9e69ef184729613f69d00a06490987))
* Deleted translation using Weblate (English (United Kingdom)) ([0cb65f5](https://github.com/leinelissen/jellyfin-audio-player/commit/0cb65f5e20a5f262a15c7a3ab5a8df2e8185153d))
* Deleted translation using Weblate (English (United Kingdom)) ([70e4015](https://github.com/leinelissen/jellyfin-audio-player/commit/70e401538ce23fd60e313d73d35c0e58aadb3198))
* Deleted translation using Weblate (English (United Kingdom)) ([1febe64](https://github.com/leinelissen/jellyfin-audio-player/commit/1febe64aad5b767793249f978ca2085cd2dd740d))
* Deleted translation using Weblate (English (United Kingdom)) ([0aac29b](https://github.com/leinelissen/jellyfin-audio-player/commit/0aac29b15f5a7b9491daa057b9a54448c8e23fdb))
* do a request when generating credentials to ensure the access token is valid ([440d789](https://github.com/leinelissen/jellyfin-audio-player/commit/440d789f5e66f6fbe3fd56febaa353a2e712c24a))
* don't emit any paused events ([9aff784](https://github.com/leinelissen/jellyfin-audio-player/commit/9aff784580f72e0856f58213a6c6bc3e070b9ef4))
* downloads disappear after update (fixes [#136](https://github.com/leinelissen/jellyfin-audio-player/issues/136)) ([ba73aaa](https://github.com/leinelissen/jellyfin-audio-player/commit/ba73aaa383e1c06ae86f3b8c81b5311dc5da58f4))
* include play modal on search page ([e140a0e](https://github.com/leinelissen/jellyfin-audio-player/commit/e140a0e487d377d6bfe3c847dd2fdc90fafbd8d8))
* include width units for similar album cover image ([ed78e4a](https://github.com/leinelissen/jellyfin-audio-player/commit/ed78e4ab491733e33f562fa7eff0482c542e68ae))
* move now playing overlay on search tab to make space for input field ([fd3c348](https://github.com/leinelissen/jellyfin-audio-player/commit/fd3c3487bef5095fc3e8b5fc4fec0e58997fb55e))
* POST the scrobble payload instead of GET ([3650a0f](https://github.com/leinelissen/jellyfin-audio-player/commit/3650a0fedee9ca01a31d616a27e1b08141c47f9e))
* properly end previous playing track ([8ff785d](https://github.com/leinelissen/jellyfin-audio-player/commit/8ff785da40a96d882cdae8c8dd7d2bd1424759ba))
* send correct amount of ticks for playback reporting ([d15b7ea](https://github.com/leinelissen/jellyfin-audio-player/commit/d15b7ea29d7cdacf098478922a43b8d300b8d3f3))
* send stopped event to right URL ([8209db3](https://github.com/leinelissen/jellyfin-audio-player/commit/8209db3a4b8d68046fb9ba16687689dff6548a07))
* show empty queue when resetting state ([dd220ec](https://github.com/leinelissen/jellyfin-audio-player/commit/dd220ec0f2b8222ca0db3c75afc27ff5776b9de8))
* show error messages when tracks fail to download ([2bd9cf9](https://github.com/leinelissen/jellyfin-audio-player/commit/2bd9cf99505dcf700e8cc52a7b506acf9661cc6b))
* supply positionticks for scrobbling as integer ([1270390](https://github.com/leinelissen/jellyfin-audio-player/commit/1270390a9c04163591ade2fdb38bda117f04f151))
* the privacy policy is in fact a privacy policy ([4a43583](https://github.com/leinelissen/jellyfin-audio-player/commit/4a43583e4a51f1f37a367cd0025b586548d5b06d))
* weird active style in playlist view ([8b1ce6b](https://github.com/leinelissen/jellyfin-audio-player/commit/8b1ce6b97c418853ec76d46ab59adc25287df63d))


### Features

* add artist views ([c9036b5](https://github.com/leinelissen/jellyfin-audio-player/commit/c9036b56ed427be82a25c1d2c7af893c0aebd98f))
* Added translation using Weblate (English (United Kingdom)) ([161344d](https://github.com/leinelissen/jellyfin-audio-player/commit/161344d00c2a79a759e011eeed2bc195122f739a))
* Added translation using Weblate (English (United Kingdom)) ([4806fbd](https://github.com/leinelissen/jellyfin-audio-player/commit/4806fbd92797457a595171586a1f8236c0aefe50))
* Added translation using Weblate (English (United Kingdom)) ([c260c15](https://github.com/leinelissen/jellyfin-audio-player/commit/c260c15c01ab4f23fb81fd68a02316e8a37c3c3c))
* Added translation using Weblate (English (United Kingdom)) ([0fc40aa](https://github.com/leinelissen/jellyfin-audio-player/commit/0fc40aaff60291f5a38ecd0d11f5a91a9b5d72a5))
* Added translation using Weblate (English (United Kingdom)) ([b49e1e5](https://github.com/leinelissen/jellyfin-audio-player/commit/b49e1e5436ac4a67c19903e1966ac302f0312347))
* Added translation using Weblate (Italian) ([123a7b3](https://github.com/leinelissen/jellyfin-audio-player/commit/123a7b36c7477bfb7819f9440a2eb35df27e03cd))
* Added translation using Weblate (Norwegian Bokmål) ([57d569b](https://github.com/leinelissen/jellyfin-audio-player/commit/57d569bd4f306aac59faf0f285154dbb175f3e83))
* Added translation using Weblate (Polish) ([464192b](https://github.com/leinelissen/jellyfin-audio-player/commit/464192b1ded72a7f3f154b5435d2412277288e74))
* Added translation using Weblate (Ukrainian) ([0cf1c20](https://github.com/leinelissen/jellyfin-audio-player/commit/0cf1c20ec1788e42ebeba4089bb3d340f5f44748))
* allow users to override color scheme (closes [#138](https://github.com/leinelissen/jellyfin-audio-player/issues/138)) ([130b18b](https://github.com/leinelissen/jellyfin-audio-player/commit/130b18bc2edb70e7c67ac36e7a1e2b570457a91d))
* incorporate italian language ([73af159](https://github.com/leinelissen/jellyfin-audio-player/commit/73af159b2eba8a8c7b830145521b6419ea64c801))
* loop a single song (closes [#139](https://github.com/leinelissen/jellyfin-audio-player/issues/139)) ([fb4d393](https://github.com/leinelissen/jellyfin-audio-player/commit/fb4d3932e5038acf57778fe3eedad0dee6078cfa))
* make downloads available from iOS File app ([7d6e897](https://github.com/leinelissen/jellyfin-audio-player/commit/7d6e897cf61bc845ccf097cc7006530ddb127709))
* naive scrobbling integration ([0bf2775](https://github.com/leinelissen/jellyfin-audio-player/commit/0bf2775c93b4a8fad91d810834411dc01779f8f7))



# [2.1.0](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.5...v2.1.0) (2023-04-23)


### Bug Fixes

* also add navigator padding when playing the first track in a queue ([1d7db11](https://github.com/leinelissen/jellyfin-audio-player/commit/1d7db11328dff87302be837f248845636c9834dc))
* contentInset doesn't behave on Android ([1d97830](https://github.com/leinelissen/jellyfin-audio-player/commit/1d97830f831814c852b6efe61eb82367d13a3aca))
* correctly calculate amount of minutes when an hour is present ([2e816f4](https://github.com/leinelissen/jellyfin-audio-player/commit/2e816f4a71f563de25032daa78c1310bdc320c58))
* keep album views in search tab when navigating from search results ([e2c1c03](https://github.com/leinelissen/jellyfin-audio-player/commit/e2c1c0300f1a3cbf10b3552e6bad2c2a5535903b))
* linter issues ([6ccfd19](https://github.com/leinelissen/jellyfin-audio-player/commit/6ccfd19dea656169ada8a2db3bd0af81d4391d67))
* make similar albums translateable ([81b9ba6](https://github.com/leinelissen/jellyfin-audio-player/commit/81b9ba683a332052a1a4dd0d15c47a676ccdf522))
* only show similar albums if there are any ([4ff071d](https://github.com/leinelissen/jellyfin-audio-player/commit/4ff071d0c89f961e4b148b8353c77d8e5eee7019))
* padding in similar scrollwheel ([913d185](https://github.com/leinelissen/jellyfin-audio-player/commit/913d185b46b5a4f9f93110c8aca20538d7b7bbc0))
* reign in padding on album view a bit ([e116e95](https://github.com/leinelissen/jellyfin-audio-player/commit/e116e95236b24724ce4329dc39ed8fc41165cf8b))
* remove padding from Modal ([4509ef1](https://github.com/leinelissen/jellyfin-audio-player/commit/4509ef1ec683626f4b76a5e47c944508faadad87))


### Features

* add blurview to headers as well ([1a5e4ae](https://github.com/leinelissen/jellyfin-audio-player/commit/1a5e4aee12670c8835fb9cd34eadcca41b9bb16d))
* add extra metadata to the album view ([dba8724](https://github.com/leinelissen/jellyfin-audio-player/commit/dba87247d86826d3c113f0e5f79e87a3271789e1))
* finish offsets on new navigation views ([c8283fc](https://github.com/leinelissen/jellyfin-audio-player/commit/c8283fc5803abcd24efb71f1832e0a524e1a36f0))
* show artist in playlist view ([c3c32ae](https://github.com/leinelissen/jellyfin-audio-player/commit/c3c32ae565ca40f17249c59f66843e15701398f4))
* update tab bars with blurview ([7601408](https://github.com/leinelissen/jellyfin-audio-player/commit/7601408d49ac7eb60f012e4656b139835240fc1c))



## [2.0.5](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.4...v2.0.5) (2023-04-12)


### Bug Fixes

* crash when fast-image fails to load an image ([67499b1](https://github.com/leinelissen/jellyfin-audio-player/commit/67499b11037779bf33bb557fff69114cd519c78e))



## [2.0.4](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.3...v2.0.4) (2023-04-11)


### Bug Fixes

* disable BlurView on Android as it crashes the app ([1648389](https://github.com/leinelissen/jellyfin-audio-player/commit/1648389ccce088e6836bcad31bd5c3b7cb996a78))
* linter issue ([a8c0003](https://github.com/leinelissen/jellyfin-audio-player/commit/a8c0003fc13cb7d4778f65e8702b1c3c5fd1cc59))
* linting issue ([2f45f86](https://github.com/leinelissen/jellyfin-audio-player/commit/2f45f868c8cc8a7f4308282b672d1d487f480c0a))
* only set signingConfig to release when a keystore is available ([74d82eb](https://github.com/leinelissen/jellyfin-audio-player/commit/74d82eb77a412ba84d0820abbad84ac304c62611))
* use debug signing config when not having a keystore ([a532154](https://github.com/leinelissen/jellyfin-audio-player/commit/a532154ce023ba2eecbbc3c8d7bbe08bcca0cd57))


### Features

* Add base Android content for F-Droid and Play Store ([ba805e0](https://github.com/leinelissen/jellyfin-audio-player/commit/ba805e061e56d719b18cfd8a6bafccf9174110b8))
* add fallback images when album cover isn't available ([0a0c78f](https://github.com/leinelissen/jellyfin-audio-player/commit/0a0c78f3d592e0d92a6bb3fd605810e0af1441bb))
* setup Fastlane for Google Play Store ([cc14373](https://github.com/leinelissen/jellyfin-audio-player/commit/cc14373575a844458737ac6f0a6e8d8ea783ce75))



## [2.0.3](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.2...v2.0.3) (2023-02-28)


### Bug Fixes

* improve album list scrolling performance ([099bbeb](https://github.com/leinelissen/jellyfin-audio-player/commit/099bbebe38942f2c72782e6c34ad3cea0876b291))
* prevent track indexes from overflowing ([a34b6c5](https://github.com/leinelissen/jellyfin-audio-player/commit/a34b6c51141cb3cd6058733ccb3323d75f40bbd5))



## [2.0.2](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.1...v2.0.2) (2023-01-10)


### Bug Fixes

* allow user-supplied CA certificates on Android ([ccfa68c](https://github.com/leinelissen/jellyfin-audio-player/commit/ccfa68c53045dfc1a7071d282da477a3ec6c9f60)), closes [#110](https://github.com/leinelissen/jellyfin-audio-player/issues/110)
* font colour for dark mode on input ([6885ae6](https://github.com/leinelissen/jellyfin-audio-player/commit/6885ae6216119155e86146c39ca502fa8a18183f))



## [2.0.1](https://github.com/leinelissen/jellyfin-audio-player/compare/v2.0.0...v2.0.1) (2022-11-28)


### Bug Fixes

* android and ios builds ([845b379](https://github.com/leinelissen/jellyfin-audio-player/commit/845b379e0983f012a2eda65350748307d4b74dca))
* Blur obscuring buttons on Android ([e0493c4](https://github.com/leinelissen/jellyfin-audio-player/commit/e0493c4a55157abff8fbb1eddeab331ac856feff))
* BlurView on Android ([b2bd211](https://github.com/leinelissen/jellyfin-audio-player/commit/b2bd211758f13a789294b98b5a129b07519ec3f8))
* Depcreated createReducer calls ([d072292](https://github.com/leinelissen/jellyfin-audio-player/commit/d072292008929aa53738bf69e91eb6925686687a))
* Ensure proper spacing in downloads screen ([cd10ddd](https://github.com/leinelissen/jellyfin-audio-player/commit/cd10ddd260c0a8d2b967248fe6dc0aeb09983e32))
* Input icon alignment on Android ([0ffc5b6](https://github.com/leinelissen/jellyfin-audio-player/commit/0ffc5b64894099d761451483fa7cd35e76446054))
* jumpy progress animations ([9807b0e](https://github.com/leinelissen/jellyfin-audio-player/commit/9807b0e920379ea646f6940d814cd2ed239a2054))
* margin on connection notice ([68de2ca](https://github.com/leinelissen/jellyfin-audio-player/commit/68de2ca80e3ba55489a34d9464af4f891093ffe6))
* Only show single line for tracks without artists or albums ([7ed389e](https://github.com/leinelissen/jellyfin-audio-player/commit/7ed389ead647c299be229b15fab47a8cc97be8c7))
* Remove any restrictions on bitrate and samplerate ([b41031e](https://github.com/leinelissen/jellyfin-audio-player/commit/b41031eeac9b5a9976b10a93d620bfd108c8d97c))
* Rename Jellyfin Audio Player to Fintunes in translation files ([0a7f6ab](https://github.com/leinelissen/jellyfin-audio-player/commit/0a7f6abf3e6af6f5684b63b0005868f250e687a2))
* screenshotting logic ([d4570b6](https://github.com/leinelissen/jellyfin-audio-player/commit/d4570b60aecdeae4ce8dedb63c511f359e9760cb))
* switch album id to demo instance ([9a1defb](https://github.com/leinelissen/jellyfin-audio-player/commit/9a1defbeef61a79addec4f71e0363e0b0271a111))
* use entire input box as touch area for focus ([87f992d](https://github.com/leinelissen/jellyfin-audio-player/commit/87f992d912f0846773a85d67b6f67a90fe1ac293))


### Features

* Save App metadata in the repo ([9c8e474](https://github.com/leinelissen/jellyfin-audio-player/commit/9c8e474d51402f5e6fa24ab683cc86aa3e131552))



## [1.2.7](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.2.6...v1.2.7) (2022-08-13)


### Features

* Allow FLAC playback ([5b54760](https://github.com/leinelissen/jellyfin-audio-player/commit/5b54760e4ee6620062ce0cc4c79daf81753f00ae))



## [1.2.6](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.2.6-beta.1...v1.2.6) (2022-08-09)


### Bug Fixes

* Peer dependency chain ([63bbbf2](https://github.com/leinelissen/jellyfin-audio-player/commit/63bbbf2719aa5d296a6ec99774f9bf1a1aa068d0))
* Remove unused imports ([c7f0d46](https://github.com/leinelissen/jellyfin-audio-player/commit/c7f0d46b410825765ab5d074469ec23d32ffd45d))



## [1.2.6-beta.1](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.2.5...v1.2.6-beta.1) (2022-06-09)



## [1.2.5](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.2.4...v1.2.5) (2022-05-18)


### Bug Fixes

* Only pull Exoplayer from jcenter ([89d2984](https://github.com/leinelissen/jellyfin-audio-player/commit/89d29844b9821e1a42b3b60c43dc4c3078231d56))


### Features

* Apply default text styles to ReText ([37ead0e](https://github.com/leinelissen/jellyfin-audio-player/commit/37ead0ec989a8b714fde1bcb6dd36e568c6e7e8c))
* Create new progress slider from scratch ([6efc8e7](https://github.com/leinelissen/jellyfin-audio-player/commit/6efc8e757c10c66019914f7561d075c3ecaf2f69))
* Implement colored blur backgrounds ([f48d248](https://github.com/leinelissen/jellyfin-audio-player/commit/f48d2481443850888a0bd1a1cf2604420e633b26))
* Tweak progress bar gestures ([b0961d3](https://github.com/leinelissen/jellyfin-audio-player/commit/b0961d3263d5f4ef3978fde748a6a277059cb0cb))



## [1.2.4](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.2.3...v1.2.4) (2022-05-04)


### Bug Fixes

* No interaction on Android webview ([#59](https://github.com/leinelissen/jellyfin-audio-player/issues/59)) ([91eaa1d](https://github.com/leinelissen/jellyfin-audio-player/commit/91eaa1d864f66e1a6597809bd46c17907acc99ee))



## [1.2.3](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.2.3...v1.2.3) (2022-01-16)



## [0.2.3](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.2.2...v0.2.3) (2022-01-15)



## [0.2.2](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.2.1...v0.2.2) (2022-01-03)



## [0.2.1](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.2.0...v0.2.1) (2022-01-02)



# [0.2.0](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.7...v0.2.0) (2022-01-02)



## [0.1.7](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.6...v0.1.7) (2021-10-25)



## [0.1.6](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.5...v0.1.6) (2021-04-25)



## [0.1.5](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.4...v0.1.5) (2021-04-24)



## [0.1.4](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.3...v0.1.4) (2021-04-03)



## [0.1.3](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.2...v0.1.3) (2021-03-21)



## [0.1.2](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.1...v0.1.2) (2021-03-09)



## [0.1.1](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.1.0...v0.1.1) (2021-02-13)



# [0.1.0](https://github.com/leinelissen/jellyfin-audio-player/compare/v1.0.0-beta3...v0.1.0) (2021-02-07)



# [1.0.0-beta3](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.0.1-alpha1...v1.0.0-beta3) (2020-08-25)



## [0.0.1-alpha1](https://github.com/leinelissen/jellyfin-audio-player/compare/v0.0.1-alpha0...v0.0.1-alpha1) (2020-07-26)



## 0.0.1-alpha0 (2020-07-10)



