import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useGetImage } from '@/utility/JellyfinApi';
import { SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS, THEME_COLOR } from '@/CONSTANTS';
import AlbumImage from './components/AlbumImage';
import { SectionArtistItem, SectionedArtist, selectArtists } from '@/store/music/selectors';
import AlphabetScroller from '@/components/AlphabetScroller';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { Text } from '@/components/Typography';
import { NavigationProp } from '@/screens/types';
import { SafeSectionList } from '@/components/SafeNavigatorView';
import { Gap } from '@/components/Utility';

const HeadingHeight = 50;

function generateSection({ section }: { section: SectionedArtist }) {
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

const ArtistHeight = 32 + 8 * 2;

const ArtistContainer = styled.Pressable`
    padding: 8px 16px;
    border-radius: 8px;
    height: ${ArtistHeight}px;
    display: flex;
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    align-items: center;
    flex-direction: row;
    overflow: hidden;
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

interface GeneratedArtistItemProps {
    item: SectionArtistItem;
    imageURL: string;
    onPress: (payload: SectionArtistItem) => void;
}

const GeneratedArtistItem = React.memo(function GeneratedArtistItem(props: GeneratedArtistItemProps) {
    const defaultStyles = useDefaultStyles();
    const { item, imageURL, onPress } = props;

    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    return (
        <ArtistContainer
            onPress={handlePress}
            style={({ pressed }) => [
                { borderColor: defaultStyles.divider.backgroundColor },
                pressed && defaultStyles.activeBackground,
            ]}
        >
            {({ pressed }) => (
                <>
                    <AlbumImage source={{ uri: imageURL }} style={{ height: 32, width: 32, borderRadius: 4, marginBottom: 0 }} />
                    <Gap size={16} />
                    <Text
                        numberOfLines={1}
                        style={[
                            defaultStyles.text,
                            pressed && { color: THEME_COLOR },
                            { flexShrink: 1 }
                        ]}


                    >
                        {item.Name}
                    </Text>
                </>
            )}
        </ArtistContainer>
    );
});

const Artists: React.FC = () => {
    // Retrieve data from store
    // const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    const sections = useTypedSelector(selectArtists);
    
    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<SectionList<SectionArtistItem>>(null);

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

            // Then, loop through all the rows and add items for those as well.
            section.data.forEach(() => {
                offset += ArtistHeight;
                layouts[index] = ({ length: ArtistHeight, offset, index });
                index++;
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
    const selectArtist = useCallback((payload: SectionArtistItem) => (
        navigation.navigate('Artist', payload)
    ), [navigation]);
    const selectLetter = useCallback((sectionIndex: number) => { 
        listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, animated: false, }); 
    }, [listRef]);
    const generateItem = useCallback(({ item }: { item: SectionArtistItem }) => {
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.Id}>
                <GeneratedArtistItem
                    key={item.Id}
                    item={item}
                    onPress={selectArtist}
                    imageURL={getImage(item.Id)}
                />
            </View>
        );
    }, [getImage, selectArtist]);

    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });
    
    return (
        <>
            <AlphabetScroller onSelect={selectLetter} />
            <SafeSectionList
                sections={sections} 
                refreshing={isLoading}
                onRefresh={retrieveData}
                getItemLayout={(_, i) => {
                    if (!(i in itemLayouts)) {
                        console.log('COuLD NOT FIND LAYOUT ITEM', i, _);
                    }
                    return itemLayouts[i] ?? { length: 0, offset: 0, index: i };
                }}
                ref={listRef}
                keyExtractor={(item) => item.Id}
                renderSectionHeader={generateSection}
                renderItem={generateItem}
            />
        </>
    );
};


export default Artists;