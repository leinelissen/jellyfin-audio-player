import React, { useCallback, useEffect, useRef, ReactText, useMemo } from 'react';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import TouchableHandler from '@/components/TouchableHandler';
import AlbumImage, { AlbumHeight, AlbumItem } from './components/AlbumImage';
import { selectAlbumsByAlphabet } from '@/store/music/selectors';
import AlphabetScroller from '@/components/AlphabetScroller';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { Album } from '@/store/music/types';
import { Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp } from '@/screens/types';
import { SafeFlashList, useNavigationOffsets } from '@/components/SafeNavigatorView';
import { FlashList } from '@shopify/flash-list';

const SectionContainer = styled.View`
    justify-content: center;
    padding: 12px 24px;
`;

const SectionText = styled(Text)`
    font-size: 24px;
    font-weight: 400;
`;

const SectionHeading = React.memo(function SectionHeading(props: { 
    label: string; 
}) {
    const { top } = useNavigationOffsets();
    const { label } = props;

    return (
        <View style={{ paddingTop: top }}>
            <ColoredBlurView>
                <SectionContainer>
                    <SectionText>{label}</SectionText>
                </SectionContainer>
            </ColoredBlurView>
        </View>
    );
});

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

const Albums: React.FC = () => {
    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    const sections = useTypedSelector(selectAlbumsByAlphabet);
    
    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<FlashList<any>>(null);

    // Convert sections to flat array format for FlashList
    const flatData = useMemo(() => {
        const data: (string | string[])[] = [];
        sections.forEach((section) => {
            if (!section.data.length || !section.data[0].length) return;
            // Add section header
            data.push(section.label);
            // Add section items
            section.data.forEach((item) => {
                data.push(item);
            });
        });
        return data;
    }, [sections]);

    // Compute sticky header indices
    const stickyHeaderIndices = useMemo(() => {
        return flatData
            .map((item, index) => typeof item === 'string' ? index : null)
            .filter((item): item is number => item !== null);
    }, [flatData]);

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    const selectLetter = useCallback(({ letter }: { letter: string, index: number }) => { 
        const index = flatData.findIndex((item) => (
            typeof item === 'string' && item === letter
        ));
        if (index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: false });
        }
    }, [flatData]);

    const renderItem = useCallback(({ item }: { item: string | string[]; index: number }) => {
        if (typeof item === 'string') {
            return (
                <SectionHeading 
                    label={item} 
                />
            );
        }
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }}>
                {item.map((id, i) => (
                    <GeneratedAlbumItem
                        key={i}
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
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });
    
    return (
        <>
            <AlphabetScroller onSelect={selectLetter} />
            <SafeFlashList
                data={flatData}
                refreshing={isLoading}
                onRefresh={retrieveData}
                ref={listRef}
                renderItem={renderItem}
                stickyHeaderIndices={stickyHeaderIndices}
                estimatedItemSize={AlbumHeight}
                getItemType={(item) => typeof item === 'string' ? 'sectionHeader' : 'row'}
            />
        </>
    );
};

export default Albums;