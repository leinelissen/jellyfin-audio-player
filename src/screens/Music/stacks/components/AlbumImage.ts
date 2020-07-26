import styled from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { Dimensions } from 'react-native';

const Screen = Dimensions.get('screen');

export const AlbumItem = styled.View`
    width: ${Screen.width / 2 - 10}px;
    padding: 10px;
    height: 220px;
`;

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width / 2 - 40}px;
    height: ${Screen.width / 2 - 40}px;
    margin-bottom: 5px;
`;

export default AlbumImage;