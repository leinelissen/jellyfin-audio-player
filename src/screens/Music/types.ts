import { StackNavigationProp } from '@react-navigation/stack';
import { Album } from 'store/music/types';

export type StackParams = {
    [key: string]: Record<string, unknown> | undefined;
    Albums: undefined;
    Album: { id: string, album: Album };
    RecentAlbums: undefined;
    Search: undefined;
};

export type NavigationProp = StackNavigationProp<StackParams>; 
