import { StackNavigationProp } from '@react-navigation/stack';
import type { EntityId } from '@/store/types';

export type StackParams = {
    [key: string]: Record<string, unknown> | object | undefined;
    Albums: undefined;
    Album: { id: EntityId };
    Artists: undefined;
    Artist: { id: EntityId };
    Playlists: undefined;
    Playlist: { id: EntityId };
    RecentAlbums: undefined;
    Search: undefined;
    SetJellyfinServer: undefined;
    TrackPopupMenu: { trackId: EntityId };
    Lyrics: undefined;
};

export type NavigationProp = StackNavigationProp<StackParams>;