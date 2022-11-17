import { createReducer } from '@reduxjs/toolkit';
import { setReceivedErrorReportingAlert, setBitrate, setJellyfinCredentials, setOnboardingStatus } from './actions';

interface State {
    jellyfin?: {
        uri: string;
        user_id: string;
        access_token: string;
        device_id: string;
    }
    bitrate: number;
    isOnboardingComplete: boolean;
    hasReceivedErrorReportingAlert: boolean;
}

const initialState: State = {
    bitrate: 140000000,
    isOnboardingComplete: false,
    hasReceivedErrorReportingAlert: false,
};

const settings = createReducer(initialState, builder => {
    builder.addCase(setJellyfinCredentials, (state, action) => ({
        ...state,
        jellyfin: action.payload,
    }));
    builder.addCase(setBitrate, (state, action) => ({
        ...state,
        bitrate: action.payload,
    }));
    builder.addCase(setOnboardingStatus, (state, action) => ({
        ...state,
        isOnboardingComplete: action.payload,
    }));
    builder.addCase(setReceivedErrorReportingAlert, (state) => ({
        ...state,
        hasReceivedErrorReportingAlert: true,
    }));
});

export default settings;