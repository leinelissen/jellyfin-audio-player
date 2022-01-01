import { StackNavigationProp } from '@react-navigation/stack';
import { Album } from 'store/music/types';

export type MusicStackParams = {
    [key: string]: Record<string, unknown> | undefined;
    Albums: undefined;
    Album: { id: string, album: Album };
    Playlists: undefined;
    Playlist: { id: string };
    RecentAlbums: undefined;
    Search: undefined;
};

export type MusicNavigationProp = StackNavigationProp<MusicStackParams>; 
