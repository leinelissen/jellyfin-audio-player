
import React, { useCallback, useEffect, ReactText, useState} from 'react';
import { chunk } from 'lodash';
import { LayoutChangeEvent, View } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import styled from 'styled-components/native';
import { differenceInDays } from 'date-fns';
import Animated, {
    useSharedValue,
    withTiming,
    useDerivedValue,
} from 'react-native-reanimated';

import { useGetImage } from '@/utility/JellyfinApi/lib';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import TouchableHandler from '@/components/TouchableHandler';
import useDefaultStyles from '@/components/Colors';
import { Album } from '@/store/music/types';
import { Header, Paragraph, Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp, StackParams } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import CoverImage from '@/components/CoverImage';
import { t } from '@/localisation';

import AlbumImage, { AlbumItem } from './components/AlbumImage';

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

const OVERVIEW_CLOSED_LINES = 4;
const OVERVIEW_OPEN_LINES = 0;

const OverviewBackground = styled.View`
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60px;
    z-index: 2;
    background-color: transparent;
`;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const ArtistOverview: React.FC<{ overview: string }> = ({ overview }) => {
    const defaultStyles = useDefaultStyles();
    const [isOverviewOpen, setOverviewOpen] = useState(false);
    const gradientProgress = useSharedValue(1);
    const toggleOverview = useCallback(() => {
        setOverviewOpen(!isOverviewOpen);
        gradientProgress.value = withTiming(Number(!isOverviewOpen), { duration: 300 });
    }, [isOverviewOpen, gradientProgress]);
    const [width, setWidth] = useState(0);
    
    const handleLayoutChange = useCallback((e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
    }, []);


    // Animate gradient stops based on progress
    const firstStopOffset = useDerivedValue(() =>
        `${gradientProgress.value * 0.9}`, // range 0 → 0.5
    );

    const secondStopOffset = useDerivedValue(() => 
        `${gradientProgress.value * 0.75}`, // range 0.5 → 1
    );


    return (
        <View 
            onLayout={handleLayoutChange}
            style={{width: '100%', padding: 0 }}
        >
            <OverviewBackground pointerEvents="none">
                <Svg width={width} height={60} viewBox={`0 0 ${width} 60`}>
                    <Defs>
                        <AnimatedLinearGradient
                            id="overview-gradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <Stop
                                offset={firstStopOffset.value}
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={0.9}
                            />
                            <Stop
                                offset={secondStopOffset.value}
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={0.7}
                            />
                            <Stop
                                offset="0"
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={0}
                            />
                        </AnimatedLinearGradient>
                    </Defs>
                    <Rect x={0} y={0} height={60} width={width} fill="url(#overview-gradient)" />
                </Svg>
            </OverviewBackground>
            <Paragraph
                style={{ marginBottom: 10 }}
                numberOfLines={isOverviewOpen ? OVERVIEW_OPEN_LINES : OVERVIEW_CLOSED_LINES}
                ellipsizeMode="tail"
                onPress={toggleOverview}
            >{overview}</Paragraph>
        </View>
    );
};

const Artist: React.FC = () => {
    const { params } = useRoute<RouteProp<StackParams, 'Artist'>>();

    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    const artist = useTypedSelector((state) => state.music.artists.entities[params.id]);

    const albumIds: string[] = [];

    for (const album of Object.values(albums)) {
        if (album.ArtistItems.find(item => item.Id === params.id)) {
            albumIds.push(album.Id);
        }
    }

    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

    // Set callbacks
    const retrieveData = useCallback(() => {
        dispatch(fetchAllAlbums());
    }, [dispatch]);
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

    return (
        <SafeFlatList
            ListHeaderComponent={
                <View style={{ padding: 24, paddingTop: 0, paddingBottom: 8, flex: 1 }}>
                    <ArtistImageContainer>
                        <CoverImage src={getImage(params.id)} margin={0} radius={0} blurRadius={100} />
                    </ArtistImageContainer>
                    {artist?.Overview ? <ArtistOverview overview={artist.Overview} /> : null}
                    <Header>{t('albums')}</Header>
                </View>
            }
            data={chunk(albumIds, 2)}
            refreshing={isLoading}
            onRefresh={retrieveData}
            renderItem={generateItem}
        />
    );
};


export default Artist;
