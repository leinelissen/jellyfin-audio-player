import { StackNavigationProp } from '@react-navigation/stack';

export interface ModalStackParams {
    [key: string]: Record<string, unknown> | undefined;
    SetJellyfinServer: undefined;
    TrackPopupMenu: { trackId: string };
}

export type ModalNavigationProp = StackNavigationProp<ModalStackParams>; 
