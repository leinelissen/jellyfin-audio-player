import React, { useCallback, useEffect, useRef, ReactText, useMemo } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { MusicNavigationProp } from '../types';
import { SafeAreaView, SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from 'store';
import { fetchAllAlbums } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import AlbumImage, { AlbumHeight, AlbumItem } from './components/AlbumImage';
import { selectAlbumsByAlphabet, SectionedId } from 'store/music/selectors';
import AlphabetScroller from 'components/AlphabetScroller';
import { EntityId } from '@reduxjs/toolkit';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from 'components/Colors';
import { Album } from 'store/music/types';
import { Text } from 'components/Typography';
import { ShadowWrapper } from 'components/Shadow';

const HeadingHeight = 50;

function generateSection({ section }: { section: SectionedId }) {
    return (
        <SectionHeading label={section.label} key={section.label} />
    );
}

const SectionContainer = styled.View`
    height: ${HeadingHeight}px;
    justify-content: center;
    padding: 0 24px;
`;

const SectionText = styled(Text)`
    font-size: 24px;
    font-weight: 400;
`;

const SectionHeading = React.memo(function SectionHeading(props: { label: string }) {
    const { label } = props;

    return (
        <ColoredBlurView>
            <SectionContainer>
                <SectionText>{label}</SectionText>
            </SectionContainer>
        </ColoredBlurView>
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
    const navigation = useNavigation<MusicNavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<SectionList<EntityId[]>>(null);

    // Create an array that computes all the height data for the entire list in
    // advance. We can then use this pre-computed data to respond to
    // `getItemLayout` calls, without having to compute things in place (and
    // fail horribly).
    // This approach was inspired by https://gist.github.com/RaphBlanchet/472ed013e05398c083caae6216b598b5
    const itemLayouts = useMemo(() => {
        // Create an array in which we will store all possible outputs for
        // `getItemLayout`. We will loop through each potential album and add
        // items that will be in the list
        const layouts: Array<{ length: number; offset: number; index: number }> = [];
        
        // Keep track of both the index of items and the offset (in pixels) from
        // the top
        let index = 0;
        let offset = 0;

        // Loop through each individual section (i.e. alphabet letter) and add
        // all items in that particular section.
        sections.forEach((section) => {
            // Each section starts with a header, so we'll need to add the item,
            // as well as the offset.
            layouts[index] = ({ length: HeadingHeight, offset, index });
            index++;
            offset += HeadingHeight;

            // Then, loop through all the rows (sets of two albums) and add
            // items for those as well.
            section.data.forEach(() => {
                layouts[index] = ({ length: AlbumHeight, offset, index });
                index++;
                offset += AlbumHeight;
            });

            // The way SectionList works is that you get an item for a
            // SectionHeader and a SectionFooter, no matter if you've specified
            // whether you want them or not. Thus, we will need to add an empty
            // footer as an item, so that we don't mismatch our indexes
            layouts[index] = { length: 0, offset, index };
            index++;
        });

        // Then, store and memoize the output
        return layouts;
    }, [sections]);

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    const selectLetter = useCallback((sectionIndex: number) => { 
        listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, animated: false, }); 
    }, [listRef]);
    const generateItem = useCallback(({ item }: { item: EntityId[] }) => {
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.join('-')}>
                {item.map((id) => (
                    <GeneratedAlbumItem
                        key={id}
                        id={id}
                        imageUrl={getImage(id as string)}
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
        <SafeAreaView>
            <AlphabetScroller onSelect={selectLetter} />
            <SectionList
                sections={sections} 
                refreshing={isLoading}
                onRefresh={retrieveData}
                getItemLayout={(_, i) =>  itemLayouts[i] ?? { length: 0, offset: 0, index: i }}
                ref={listRef}
                keyExtractor={(item) => item.join('-')}
                renderSectionHeader={generateSection}
                renderItem={generateItem}
            />
        </SafeAreaView>
    );
};


export default Albums;