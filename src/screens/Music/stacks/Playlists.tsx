import React, { useCallback, useRef } from 'react';
import Artwork from '@/store/sources/artwork-manager';
import { Text, View, FlatList, ListRenderItem, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlaylists } from '@/store/playlists/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TouchableHandler from '@/components/TouchableHandler';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import useDefaultStyles from '@/components/Colors';
import { NavigationProp } from '@/screens/types';
import { SafeFlatList, useNavigationOffsets } from '@/components/SafeNavigatorView';
import type { Playlist } from '@/store/playlists/types';

interface GeneratedPlaylistItemProps {
    playlist: Playlist;
    imageUrl?: string | null;
    onPress: (playlist: Playlist) => void;
}

const GeneratedPlaylistItem = React.memo(function GeneratedPlaylistItem(props: GeneratedPlaylistItemProps) {
    const defaultStyles = useDefaultStyles();
    const { playlist, imageUrl, onPress } = props;

    const handlePress = useCallback(() => {
        onPress(playlist);
    }, [playlist, onPress]);

    return (
        <TouchableHandler id={playlist.id} onPress={handlePress}>
            <AlbumItem>
                <AlbumImage source={{ uri: imageUrl || undefined }} style={defaultStyles.imageBackground} />
                <Text numberOfLines={1} style={defaultStyles.text}>{playlist.name}</Text>
            </AlbumItem>
        </TouchableHandler>
    );
});

const Playlists: React.FC = () => {
    const offsets = useNavigationOffsets();

    // Retrieve data from store
    const { data: playlists } = usePlaylists();

    // Initialise helpers
    const navigation = useNavigation<NavigationProp>();

    const listRef = useRef<FlatList<Playlist>>(null);

    const getItemLayout = useCallback((
        _data: ArrayLike<Playlist> | null | undefined,
        index: number,
    ): { offset: number; length: number; index: number } => {
        const length = 220;
        const offset = length * index;
        return { index, length, offset };
    }, []);

    // Set callbacks
    const [isLoading, retrieveData] = useSyncAction(() => Sync.syncPlaylists());

    const selectPlaylist = useCallback((playlist: Playlist) => {
        navigation.navigate('Playlist', { id: [playlist.sourceId, playlist.id] });
    }, [navigation]);

    const generateItem: ListRenderItem<Playlist> = useCallback(({ item, index }) => {
        // Render an empty spacer for odd-index items (already rendered as the
        // second item in the previous even-index row).
        if (index % 2 === 1) {
            return <View key={item.id} />;
        }

        const nextItem = (playlists ?? [])[index + 1];

        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.id}>
                <GeneratedPlaylistItem
                    playlist={item}
                    imageUrl={Artwork.getUrl(item)}
                    onPress={selectPlaylist}
                />
                {nextItem && (
                    <GeneratedPlaylistItem
                        playlist={nextItem}
                        imageUrl={Artwork.getUrl(nextItem)}
                        onPress={selectPlaylist}
                    />
                )}
            </View>
        );
    }, [playlists, selectPlaylist]);

    return (
        <SafeFlatList
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={retrieveData} progressViewOffset={offsets.top} />
            }
            data={playlists ?? []}
            getItemLayout={getItemLayout}
            ref={listRef}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={generateItem}
        />
    );
};

export default Playlists;
