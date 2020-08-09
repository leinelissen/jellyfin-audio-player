import { createReducer } from '@reduxjs/toolkit';
import { setBitrate, setJellyfinCredentials, setOnboardingStatus } from './actions';

interface State {
    jellyfin?: {
        uri: string;
        user_id: string;
        access_token: string;
        device_id: string;
    }
    bitrate: number;
    isOnboardingComplete: boolean;
}

const initialState: State = {
    bitrate: 140000000,
    isOnboardingComplete: false,
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
    [setOnboardingStatus.type]: (state, action) => ({
        ...state,
        isOnboardingComplete: action.payload,
    })
});

export default settings;