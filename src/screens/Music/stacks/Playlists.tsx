import React, { useCallback, useEffect, useRef } from 'react';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { Text, View, FlatList, ListRenderItem, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { usePlaylists } from '@/store/music/hooks';
import * as musicFetchers from '@/store/music/fetchers';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { sources } from '@/store/db/schema/sources';
import { PLAYLIST_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import TouchableHandler from '@/components/TouchableHandler';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import useDefaultStyles from '@/components/Colors';
import { NavigationProp } from '@/screens/types';
import { SafeFlatList, useNavigationOffsets } from '@/components/SafeNavigatorView';

interface GeneratedAlbumItemProps {
    id: string | number;
    imageUrl?: string | null;
    name: string;
    onPress: (id: string) => void;
}

const GeneratedPlaylistItem = React.memo(function GeneratedPlaylistItem(props: GeneratedAlbumItemProps) {
    const defaultStyles = useDefaultStyles();
    const { id, imageUrl, name, onPress } = props;

    return (
        <TouchableHandler id={id as string} onPress={onPress}>
            <AlbumItem>
                <AlbumImage source={{ uri: imageUrl || undefined }} style={defaultStyles.imageBackground} />
                <Text numberOfLines={1} style={defaultStyles.text}>{name}</Text>
            </AlbumItem>
        </TouchableHandler>
    );
});

const Playlists: React.FC = () => {
    const offsets = useNavigationOffsets();

    // Retrieve data from store
    const { data: sourceData } = useLiveQuery(db.select().from(sources).limit(1));
    const sourceId = sourceData?.[0]?.id || '';
    const { playlists, ids, isLoading, lastRefreshed } = usePlaylists(sourceId);
    
    // Initialise helpers
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<FlatList<string>>(null);

    const getItemLayout = useCallback((data: ArrayLike<string> | null | undefined, index: number): { offset: number, length: number, index: number } => {
        const length = 220;
        const offset = length * index;
        return { index, length, offset };
    }, []);

    // Set callbacks
    const retrieveData = useCallback(() => musicFetchers.fetchAndStoreAllPlaylists(), []);
    const selectAlbum = useCallback((id: string) => {
        navigation.navigate('Playlist', { id });
    }, [navigation]);
    const generateItem: ListRenderItem<string> = useCallback(({ item, index }) => {
        if (index % 2 === 1) {
            return <View key={item} />;
        }

        const nextItemId = ids[index + 1];
        const nextItem = playlists[nextItemId];

        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item}>
                <GeneratedPlaylistItem
                    id={item}
                    imageUrl={getImage(playlists[item])}
                    name={playlists[item]?.Name || ''}
                    onPress={selectAlbum}
                />
                {nextItem && 
                    <GeneratedPlaylistItem
                        id={nextItemId}
                        imageUrl={getImage(nextItem)}
                        name={nextItem.Name || ''}
                        onPress={selectAlbum}
                    />
                }
            </View>
        );
    }, [playlists, getImage, selectAlbum, ids]);

    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > PLAYLIST_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });
    
    return (
        <SafeFlatList
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={retrieveData} progressViewOffset={offsets.top} />
            }
            data={ids} 
            getItemLayout={getItemLayout}
            ref={listRef}
            keyExtractor={(item, index) => `${item}_${index}`}
            renderItem={generateItem}
        />
    );
};


export default Playlists;