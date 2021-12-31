import TrackPlayer from 'react-native-track-player';
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

/**
 * Monkey-patch the track-player to also emit track added events
 */
export function patchTrackPlayer() {
    const oldAddFunction = TrackPlayer.add;
    TrackPlayer.add = (...args: Parameters<typeof oldAddFunction>) => {
        emitTrackAdded();
        return oldAddFunction(...args);
    };
}