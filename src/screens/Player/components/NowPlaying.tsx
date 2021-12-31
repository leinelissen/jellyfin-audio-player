import React from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import useCurrentTrack from 'utility/useCurrentTrack';
import styled from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import useDefaultStyles from 'components/Colors';
import Text from 'components/Text';

const Screen = Dimensions.get('screen');

const Artwork = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width * 0.8}px;
    height: ${Screen.width * 0.8}px;
    margin: 25px auto;
`;

const styles = StyleSheet.create({
    artist: {
        fontWeight: 'bold',
        fontSize: 24,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
        paddingLeft: 20,
        paddingRight: 20,
    }
});


export default function NowPlaying() {
    const { track } = useCurrentTrack();
    const defaultStyles = useDefaultStyles();

    return (
        <View style={{ alignItems: 'center' }}>
            <Artwork
                style={defaultStyles.imageBackground}
                source={{ 
                    uri: track?.artwork as string | undefined,
                    priority: FastImage.priority.high,
                }} 
            />
            <Text style={styles.artist}>{track?.artist}</Text>
            <Text style={styles.title}>{track?.title}</Text>
        </View>
    );
}