import React, { Component, useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, AlbumTrack } from '../types';
import { Text, ScrollView, Dimensions, FlatList, Button, TouchableOpacity } from 'react-native';
import { retrieveAlbumTracks, getImage, generateTrack } from '../../../utility/JellyfinApi';
import styled from 'styled-components/native';

interface Props extends StackScreenProps<RootStackParamList, 'Album'> {
    //
}

interface State {
    tracks: AlbumTrack[];
}

const Screen = Dimensions.get('screen');

const AlbumImage = styled.Image`
    border-radius: 10px;
    width: ${Screen.width * 0.6}px;
    height: ${Screen.width * 0.6}px;
    margin: 10px auto;
`;

const TrackContainer = styled.View`
    padding: 15px;
    border-bottom-width: 1px;
    border-bottom-color: #eee;
    flex-direction: row;
`;

interface TouchableTrackProps {
    id: string;
    onPress: (id: string) => void;
}

const TouchableTrack: React.FC<TouchableTrackProps>  = ({ id, onPress, children }) => {
    const handlePress = useCallback(() => {
        return onPress(id);
    }, [id]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <TrackContainer>
                {children}
            </TrackContainer>
        </TouchableOpacity>
    );
};

export default class Album extends Component<Props, State> {
    state: State = {
        tracks: [],
    }

    async componentDidMount() {
        const tracks = await retrieveAlbumTracks(this.props.route.params.id);
        this.setState({ tracks });
    }

    selectTrack = async (id: string) => {
        const track = await generateTrack(id);
        await TrackPlayer.add([ track ]);
        await TrackPlayer.skip(id);
        TrackPlayer.play();
    }

    playAlbum = async () => {
        const tracks = await Promise.all(this.state.tracks.map(track => generateTrack(track.Id)));
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(tracks[0].id);
        TrackPlayer.play();
    }

    render() {
        const { tracks } = this.state;
        const { album } = this.props.route.params;

        return (
            <ScrollView style={{ backgroundColor: '#f6f6f6', padding: 20, paddingBottom: 50 }}>
                <AlbumImage source={{ uri: getImage(album.Id) }} />
                <Text style={{ fontSize: 36, fontWeight: 'bold' }} >{album.Name}</Text>
                <Text style={{ fontSize: 24, opacity: 0.5, marginBottom: 24 }}>{album.AlbumArtist}</Text>
                <Button title="Play Album" onPress={this.playAlbum} />
                {tracks.length ? tracks.map((track) =>
                    <TouchableTrack key={track.Id} id={track.Id} onPress={this.selectTrack}>
                        <Text style={{ width: 20, opacity: 0.5, marginRight: 5 }}>{track.IndexNumber}</Text>
                        <Text>{track.Name}</Text>
                    </TouchableTrack>
                ) : undefined}
            </ScrollView>
        );
    }
}