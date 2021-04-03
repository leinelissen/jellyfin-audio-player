import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from 'react-native-track-player';

interface State {
    addedTrackCount: number,
    currentTrack: Track | undefined,   
}

const initialState: State = {
    addedTrackCount: 0,
    currentTrack: undefined,
};

const player = createSlice({
    name: 'player',
    initialState,
    reducers: {
        addNewTrackToPlayer: (state) => {
            state.addedTrackCount += 1;
        },
        setCurrentTrack: (state, action: PayloadAction<Track | undefined>) => {
            state.currentTrack = action.payload;
        },
    }
});

export default player;