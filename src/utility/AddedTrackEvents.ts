import TrackPlayer, { AddTrack } from 'react-native-track-player';
import { useEffect } from 'react';
import EventEmitter from 'events';

const eventName = 'track-added';
const addedTrackEmitter = new EventEmitter();

/**
 * Emit the event that a track has been added
 */
export function emitTrackAdded() {
    addedTrackEmitter.emit(eventName);
}

/**
 * Call the callback whenever a track has been added to the queue
 */
export function onTrackAdded(callback: () => void) {
    addedTrackEmitter.addListener(eventName, callback);
}

/**
 * A hook to manage the listeners for the added track function
 */
export function useOnTrackAdded(callback: () => void) {
    useEffect(() => {
        addedTrackEmitter.addListener(eventName, callback);
        return () => {
            addedTrackEmitter.removeListener(eventName, callback);
        };
    });
}

type OverloadedParameters<T> =
    T extends { (...args: infer A1): any; (...args: infer A2): any; (...args: infer A3): any; (...args: infer A4): any } ? A1 | A2 | A3 | A4 :
        T extends { (...args: infer A1): any; (...args: infer A2): any; (...args: infer A3): any } ? A1 | A2 | A3 :
            T extends { (...args: infer A1): any; (...args: infer A2): any } ? A1 | A2 :
                T extends (...args: infer A) => any ? A : any

/**
 * Monkey-patch the track-player to also emit track added events
 */
export function patchTrackPlayer() {
    const oldAddFunction = TrackPlayer.add;
    TrackPlayer.add = (...args: OverloadedParameters<typeof oldAddFunction>) => {
        emitTrackAdded();
        return oldAddFunction(args[0] as AddTrack, args[1]);
    };
}