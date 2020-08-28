import { createSlice } from '@reduxjs/toolkit';

const player = createSlice({
    name: 'player',
    initialState: 0,
    reducers: {
        addNewTrackToPlayer: (state) => state + 1,
    }
});

export default player;