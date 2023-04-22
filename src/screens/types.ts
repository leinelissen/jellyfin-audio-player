import { StackNavigationProp } from '@react-navigation/stack';
import { Album } from 'store/music/types';

export type StackParams = {
    [key: string]: Record<string, unknown> | undefined;
    Albums: undefined;
    Album: { id: string, album: Album };
    Playlists: undefined;
    Playlist: { id: string };
    RecentAlbums: undefined;
    Search: undefined;
    SetJellyfinServer: undefined;
    TrackPopupMenu: { trackId: string };
};

export type NavigationProp = StackNavigationProp<StackParams>; 
