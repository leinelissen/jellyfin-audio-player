import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface State {
    date: number | null;
}

export const initialState: State = {
    date: null,
};

const sleepTimer = createSlice({
    name: 'sleep-timer',
    initialState,
    reducers: {
        setTimerDate(state, action: PayloadAction<Date | null>) {
            state.date = action.payload?.getTime() || null;
        }
    },
});

export const { setTimerDate } = sleepTimer.actions;

export default sleepTimer;