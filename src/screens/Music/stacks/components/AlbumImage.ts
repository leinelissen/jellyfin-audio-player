import styled from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { Dimensions } from 'react-native';

const Screen = Dimensions.get('screen');
export const AlbumWidth = Screen.width / 2 - 24;
export const AlbumHeight = AlbumWidth + 40;
export const CoverSize = AlbumWidth - 16;

export const AlbumItem = styled.View`
    width: ${AlbumWidth}px;
    height: ${AlbumHeight}px;
    padding: 8px;
`;

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${CoverSize}px;
    height: ${CoverSize}px;
    margin-bottom: 5px;
`;

export default AlbumImage;