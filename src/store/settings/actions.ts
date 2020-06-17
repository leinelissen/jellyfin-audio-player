import { createAction } from '@reduxjs/toolkit';

export const setJellyfinCredentials = createAction<{ access_token: string, user_id: string, uri: string, deviced_id: string; }>('SET_JELLYFIN_CREDENTIALS');
export const setBitrate = createAction<number>('SET_BITRATE');