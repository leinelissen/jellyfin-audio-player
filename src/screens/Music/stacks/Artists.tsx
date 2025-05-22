import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import AlbumImage from './components/AlbumImage';
import { SectionArtistItem, selectArtists } from '@/store/music/selectors';
import AlphabetScroller from '@/components/AlphabetScroller';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { Text } from '@/components/Typography';
import { NavigationProp } from '@/screens/types';
import { SafeFlashList, useNavigationOffsets } from '@/components/SafeNavigatorView';
import { Gap } from '@/components/Utility';
import { FlashList } from '@shopify/flash-list';

const SectionContainer = styled.View`
    justify-content: center;
    padding: 12px 24px;
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
                            pressed && defaultStyles.themeColor,
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
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    const sections = useTypedSelector(selectArtists);
    
    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<FlashList<any>>(null);

    // Convert sections to flat array format for FlashList
    const flatData = useMemo(() => {
        const data: (string | SectionArtistItem)[] = [];
        sections.forEach((section) => {
            if (!section.data.length) return;
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
    const selectArtist = useCallback((payload: SectionArtistItem) => (
        navigation.navigate('Artist', payload)
    ), [navigation]);
    const selectLetter = useCallback(({ letter }: { letter: string, index: number }) => { 
        const index = flatData.findIndex((item) => (
            typeof item === 'string' && item === letter
        ));
        if (index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: false });
        }
    }, [flatData]);

    const renderItem = useCallback(({ item }: { item: string | SectionArtistItem }) => {
        if (typeof item === 'string') {
            return <SectionHeading label={item} />;
        }
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 32 }}>
                <GeneratedArtistItem
                    key={item.Id}
                    item={item}
                    onPress={selectArtist}
                    imageURL={getImage(item)}
                />
            </View>
        );
    }, [getImage, selectArtist]);

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
                estimatedItemSize={ArtistHeight}
                getItemType={(item) => typeof item === 'string' ? 'sectionHeader' : 'row'}
            />
        </>
    );
};

export default Artists;