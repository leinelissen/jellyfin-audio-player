import { createReducer } from '@reduxjs/toolkit';
import { setReceivedErrorReportingAlert, setBitrate, setJellyfinCredentials, setOnboardingStatus, setEnablePlaybackReporting, setColorScheme, setSleepTime, setEnableSleepTimer, setRemainingSleepTime } from './actions';
import { ColorScheme } from './types';

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
    enablePlaybackReporting: boolean;
    colorScheme: ColorScheme;
    sleepTime: number;
}

const initialState: State = {
    bitrate: 140000000,
    isOnboardingComplete: false,
    hasReceivedErrorReportingAlert: false,
    enablePlaybackReporting: true,
    colorScheme: ColorScheme.System,
    sleepTime: 60,
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
    builder.addCase(setEnablePlaybackReporting, (state, action) => ({
        ...state,
        enablePlaybackReporting: action.payload,
    }));
    builder.addCase(setColorScheme, (state, action) => ({
        ...state,
        colorScheme: action.payload,
    }));
    builder.addCase(setSleepTime, (state, action) => ({
        ...state,
        sleepTime: action.payload,
    }));
    builder.addCase(setEnableSleepTimer, (state, action) => ({
        ...state,
        enableSleepTimer: action.payload,
    }));
    builder.addCase(setRemainingSleepTime, (state, action) => ({
        ...state,
        remainingSleepTime: action.payload,
    }));
});

export default settings;