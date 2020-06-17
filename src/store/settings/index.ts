import { createReducer } from '@reduxjs/toolkit';
import { setBitrate, setJellyfinCredentials } from './actions';

interface State {
    jellyfin?: {
        uri: string;
        user_id: string;
        access_token: string;
        device_id: string;
    }
    bitrate: number;
}

const initialState: State = {
    bitrate: 140000000
};

const settings = createReducer(initialState, {
    [setJellyfinCredentials.type]: (state, action) => ({
        ...state,
        jellyfin: action.payload,
    }),
    [setBitrate.type]: (state, action) => ({
        ...state,
        bitrate: action.payload,
    }),
});

export default settings;