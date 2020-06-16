import React, { Component, useCallback } from 'react';
import { retrieveAlbums, getImage } from '../../../utility/JellyfinApi';
import { Album, RootStackParamList } from '../types';
import { Text, SafeAreaView, FlatList, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<RootStackParamList, 'Albums'>;
}

interface State {
    albums: Album[];
    refreshing: boolean;
}

const Screen = Dimensions.get('screen');

const Container = styled.View`
    /* flex-direction: row;
    flex-wrap: wrap;
    flex: 1; */
    padding: 10px;
    background-color: #f6f6f6;
`;

const AlbumItem = styled.View`
    width: ${Screen.width / 2 - 10}px;
    padding: 10px;
`;

const AlbumImage = styled.Image`
    border-radius: 10px;
    width: ${Screen.width / 2 - 40}px;
    height: ${Screen.width / 2 - 40}px;
    background-color: #fefefe;
    margin-bottom: 5px;
`;

interface TouchableAlbumItemProps {
    id: string;
    onPress: (id: string) => void;
}

const TouchableAlbumItem: React.FC<TouchableAlbumItemProps>  = ({ id, onPress, children }) => {
    const handlePress = useCallback(() => {
        return onPress(id);
    }, [id]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <AlbumItem>
                {children}
            </AlbumItem>
        </TouchableOpacity>
    );
};

class Albums extends Component<Props, State> {
    state: State = {
        albums: [],
        refreshing: false,
    }

    componentDidMount() {
        this.retrieveData();
    }

    retrieveData = async () => {
        this.setState({ refreshing: true });
        const albums = await retrieveAlbums() as Album[];
        this.setState({ albums, refreshing: false });
    }
    
    selectAlbum = (id: string) => {
        const album = this.state.albums.find((d) => d.Id === id) as Album;
        this.props.navigation.navigate('Album', { id, album });
    }

    render() {
        const { albums, refreshing } = this.state;

        return (
            <SafeAreaView>
                <Container>
                    <FlatList
                        data={albums} 
                        keyExtractor={(item: Album) => item.Id}
                        refreshing={refreshing}
                        onRefresh={this.retrieveData}
                        numColumns={2}
                        renderItem={({ item }: { item: Album }) => (
                            <TouchableAlbumItem id={item.Id} onPress={this.selectAlbum}>
                                <AlbumImage source={{ uri: getImage(item.Id) }} />
                                <Text>{item.Name}</Text>
                                <Text style={{ opacity: 0.5 }}>{item.AlbumArtist}</Text>
                            </TouchableAlbumItem>
                        )}
                    />
                </Container>
            </SafeAreaView>
        );
    }
}

export default Albums;