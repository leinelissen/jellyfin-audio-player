import React, { useState, useEffect, useCallback } from 'react';
import Input from 'components/Input';
import { Text } from 'react-native';
import styled from 'styled-components/native';
import { useTypedSelector } from 'store';
import Fuse from 'fuse.js';

const Container = styled.View`
    padding: 0 20px;
`;

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const albums = useTypedSelector(state => state.music.albums.entities);
    const [results, setResults] = useState([]);
    let fuse: Fuse<{}, {}>;

    useEffect(() => {
        fuse = new Fuse(Object.values(albums), {
            keys: ['Name', 'AlbumArtist', 'AlbumArtists', 'Artists'],
            threshold: 0.1,
            includeScore: true,
        });
    }, [albums]);

    useEffect(() => {
        setResults(fuse.search(searchTerm));
    }, [searchTerm, setResults, fuse]);

    return (
        <Container>
            <Input value={searchTerm} onChangeText={setSearchTerm} placeholder="Search..." />
            {results.map((result) => (
                <Text key={result.refIndex}>{result.item.Name} - {result.item.AlbumArtist}</Text>
            ))}
        </Container>
    );
}