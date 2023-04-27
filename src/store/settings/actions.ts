import { createAction } from '@reduxjs/toolkit';

export const setJellyfinCredentials = createAction<{ access_token: string, user_id: string, uri: string, device_id: string; }>('SET_JELLYFIN_CREDENTIALS');
export const setBitrate = createAction<number>('SET_BITRATE');
export const setOnboardingStatus = createAction<boolean>('SET_ONBOARDING_STATUS');
export const setReceivedErrorReportingAlert = createAction<void>('SET_RECEIVED_ERROR_REPORTING_ALERT');
export const setEnablePlaybackReporting = createAction<boolean>('SET_ENABLE_PLAYBACK_REPORTING');