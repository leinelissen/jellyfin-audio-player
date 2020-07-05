import React, { useCallback, useEffect, useRef, PureComponent, ReactText } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { Album, NavigationProp } from '../types';
import { Text, SafeAreaView, SectionList, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from 'store';
import { fetchAllAlbums } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import ListContainer from './components/ListContainer';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { selectAlbumsByAlphabet, SectionedId } from 'store/music/selectors';
import AlphabetScroller from 'components/AlphabetScroller';
import { EntityId } from '@reduxjs/toolkit';
import styled from 'styled-components/native';

interface VirtualizedItemInfo {
    section: SectionedId,
    // Key of the section or combined key for section + item
    key: string,
    // Relative index within the section
    index: number,
    // True if this is the section header
    header?: boolean,
    leadingItem?: EntityId,
    leadingSection?: SectionedId,
    trailingItem?: EntityId,
    trailingSection?: SectionedId,
}

type VirtualizedSectionList = { _subExtractor: (index: number) => VirtualizedItemInfo };

function generateSection({ section }: { section: SectionedId }) {
    return (
        <SectionHeading label={section.label} key={section.label} />
    );
}

const SectionContainer = styled.View`
    background-color: #f6f6f6;
    border-bottom-color: #eee;
    border-bottom-width: 1px;
    height: 50px;
    justify-content: center;
`;

const SectionText = styled.Text`
    font-size: 24px;
    font-weight: bold;
`;

class SectionHeading extends PureComponent<{ label: string }> {    
    render() {
        const { label } = this.props;

        return (
            <SectionContainer>
                <SectionText>{label}</SectionText>
            </SectionContainer>
        );
    }
}

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

class GeneratedAlbumItem extends PureComponent<GeneratedAlbumItemProps> {
    render() {
        const { id, imageUrl, name, artist, onPress } = this.props;

        return (
            <TouchableHandler id={id as string} onPress={onPress}>
                <AlbumItem>
                    <AlbumImage source={{ uri: imageUrl }} />
                    <Text numberOfLines={1}>{name}</Text>
                    <HalfOpacity numberOfLines={1}>{artist}</HalfOpacity>
                </AlbumItem>
            </TouchableHandler>
        );
    }
}

const Albums: React.FC = () => {
    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.lastRefreshed);
    const sections = useTypedSelector(selectAlbumsByAlphabet);
    
    // Initialise helpers
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<SectionList<EntityId>>(null);

    const getItemLayout = useCallback((data: SectionedId[] | null, index: number): { offset: number, length: number, index: number } => {
        // We must wait for the ref to become available before we can use the
        // native item retriever in VirtualizedSectionList
        if (!listRef.current) {
            return { offset: 0, length: 0, index };
        }

        // Retrieve the right item info
        // @ts-ignore
        const wrapperListRef = (listRef.current?._wrapperListRef) as VirtualizedSectionList;
        const info: VirtualizedItemInfo = wrapperListRef._subExtractor(index);
        const { index: itemIndex, header, key } = info;
        const sectionIndex = parseInt(key.split(':')[0]);

        // We can then determine the "length" (=height) of this item. Header items
        // end up with an itemIndex of -1, thus are easy to identify.
        const length = header ? 50 : (itemIndex % 2 === 0 ? 220 : 0);
    
        // We'll also need to account for any unevenly-ended lists up until the
        // current item.
        const previousRows = data?.filter((row, i) => i < sectionIndex)
            .reduce((sum, row) => sum + Math.ceil(row.data.length / 2), 0) || 0;

    
        // We must also calcuate the offset, total distance from the top of the
        // screen. First off, we'll account for each sectionIndex that is shown up
        // until now. This only includes the heading for the current section if the
        // item is not the section header
        const headingOffset = 50 * (header ? sectionIndex : sectionIndex + 1);
        const currentRows = itemIndex > 1 ? Math.ceil((itemIndex + 1) / 2) : 0;
        const itemOffset = 220 * (previousRows + currentRows);
        const offset = headingOffset + itemOffset;
    
        return { index, length, offset };
    }, [listRef]);

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    const selectLetter = useCallback((sectionIndex: number) => { 
        listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, animated: false, }); 
    }, [listRef]);
    const generateItem = useCallback(({ item, index, section }: { item: EntityId, index: number, section: SectionedId }) => {
        if (index % 2 === 1) {
            return <View key={item} />;
        }
        const nextItem = section.data[index + 1];

        return (
            <View style={{ flexDirection: 'row' }} key={item}>
                <GeneratedAlbumItem
                    id={item}
                    imageUrl={getImage(item as string)}
                    name={albums[item]?.Name || ''}
                    artist={albums[item]?.AlbumArtist || ''}
                    onPress={selectAlbum}
                />
                {albums[nextItem] && 
                    <GeneratedAlbumItem
                        id={nextItem}
                        imageUrl={getImage(nextItem as string)}
                        name={albums[nextItem]?.Name || ''}
                        artist={albums[nextItem]?.AlbumArtist || ''}
                        onPress={selectAlbum}
                    />
                }
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
            <ListContainer>
                <AlphabetScroller onSelect={selectLetter} />
                <SectionList
                    sections={sections} 
                    refreshing={isLoading}
                    onRefresh={retrieveData}
                    getItemLayout={getItemLayout}
                    ref={listRef}
                    keyExtractor={(item, index) => `${item}_${index}`}
                    onScrollToIndexFailed={console.log}
                    renderSectionHeader={generateSection}
                    renderItem={generateItem}
                />
            </ListContainer>
        </SafeAreaView>
    );
};


export default Albums;