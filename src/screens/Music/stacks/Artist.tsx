
import React, { useCallback, useEffect, ReactText, useState} from 'react';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums, fetchArtistOverview } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import TouchableHandler from '@/components/TouchableHandler';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import styled from 'styled-components/native';
import useDefaultStyles from '@/components/Colors';
import { Album } from '@/store/music/types';
import { Header, SubHeader, Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp, StackParams } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import { chunk } from 'lodash';
import CoverImage from '@/components/CoverImage';

interface GeneratedAlbumItemProps {
    id: ReactText;
    imageUrl: string;
    name: string;
    artist: string;
    onPress: (id: string) => void;
}

const HalfOpacity = styled.Text`
    opacity: 0.5;
`;

const ArtistImageContainer = styled.View`
    margin: 0 12px 24px 12px;
    flex: 1;
    align-items: center;
`;

const GeneratedAlbumItem = React.memo(function GeneratedAlbumItem(props: GeneratedAlbumItemProps) {
    const defaultStyles = useDefaultStyles();
    const { id, imageUrl, name, artist, onPress } = props;

    return (
        <TouchableHandler id={id as string} onPress={onPress}>
            <AlbumItem>
                <ShadowWrapper size="medium">
                    <AlbumImage source={{ uri: imageUrl }} style={[defaultStyles.imageBackground]} />
                </ShadowWrapper>
                <Text numberOfLines={1} style={defaultStyles.text}>{name}</Text>
                <HalfOpacity style={defaultStyles.text} numberOfLines={1}>{artist}</HalfOpacity>
            </AlbumItem>
        </TouchableHandler>
    );
});

const Artist: React.FC = () => {
    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    
    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { params } = useRoute<RouteProp<StackParams, 'Artist'>>();
    const getImage = useGetImage();
    
    const [overview, setOverview] = useState('');
    const [overviewLines, setOverviewLines] = useState(4);

    useEffect(() => {
        const retrieveOverview = async () => {
            const result = await dispatch(fetchArtistOverview(params.Id));

            setOverview(result.payload as string);
        };

        retrieveOverview();
    }, [params.Id, overview, dispatch]);

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    const generateItem = useCallback(({ item }: { item: string[] }) => {
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.join('-')}>
                {item.map((id) => (
                    <GeneratedAlbumItem
                        key={id}
                        id={id}
                        imageUrl={getImage(albums[id])}
                        name={albums[id]?.Name || ''}
                        artist={albums[id]?.AlbumArtist || ''}
                        onPress={selectAlbum}
                    />
                ))}
            </View>
        );
    }, [albums, getImage, selectAlbum]);

    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });

    const toggleOverview = useCallback(() => {
        if (overviewLines) {
            setOverviewLines(0);
        } else {
            setOverviewLines(4);
        }
    }, [overviewLines]);
    
    return (
        <SafeFlatList
            ListHeaderComponent={
                <View style={{ padding: 24, paddingTop: 32, paddingBottom: 8, flex: 1 }}>
                    <ArtistImageContainer>
                        <CoverImage src={getImage(params.Id)} />
                    </ArtistImageContainer>
                    <Header>{params.Name}</Header>
                    {overview
                        ? <SubHeader
                            numberOfLines={overviewLines}
                            ellipsizeMode="tail"
                            onPress={toggleOverview}
                        >{overview}</SubHeader>
                        : null
                    }
                </View>
            }
            data={chunk(params.albumIds, 2)}
            refreshing={isLoading}
            onRefresh={retrieveData}
            renderItem={generateItem}
        />
    );
};


export default Artist;
