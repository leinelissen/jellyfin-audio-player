import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useSelector, TypedUseSelectorHook, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer, PersistConfig, createMigrate, PersistState } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';

import settings from './settings';
import music, { initialState as musicInitialState } from './music';
import downloads, { initialState as downloadsInitialState } from './downloads';
import sleepTimer from './sleep-timer';
import { ColorScheme } from './settings/types';

const persistConfig: PersistConfig<Omit<AppState, '_persist'>> = {
    key: 'root',
    storage: AsyncStorage,
    version: 2,
    stateReconciler: autoMergeLevel2,
    migrate: createMigrate({
        // @ts-expect-error migrations are poorly typed
        1: (state: AppState & PersistState) => {
            return {
                ...state,
                settings: state.settings,
                downloads: downloadsInitialState,
                music: musicInitialState
            };
        },
        // @ts-expect-error migrations are poorly typed
        2: (state: AppState) => {
            return {
                ...state,
                downloads: {
                    ...state.downloads,
                    queued: []
                }
            };
        },
        // @ts-expect-error migrations are poorly typed
        3: (state: AppState) => {
            return {
                ...state,
                settings: {
                    ...state.settings,
                    enablePlaybackReporting: true,
                }
            };
        },
        // @ts-expect-error migrations are poorly typed
        4: (state: AppState) => {
            return {
                ...state,
                settings: {
                    ...state.settings,
                    colorScheme: ColorScheme.System,
                }
            };
        },
        // @ts-expect-error migrations are poorly typed
        4: (state: AppState) => {
            return {
                ...state,
                sleepTimer: {
                    date: null,
                }
            };
        },
    })
};

const reducers = combineReducers({
    settings,
    music: music.reducer,
    downloads: downloads.reducer,
    sleepTimer: sleepTimer.reducer,
});

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => (
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false })
    ),
});

export type AppState = ReturnType<typeof reducers> & { _persist: PersistState };
export type AppDispatch = typeof store.dispatch;
export type AsyncThunkAPI = { state: AppState, dispatch: AppDispatch };
export type Store = typeof store;
export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;

export const persistedStore = persistStore(store);

export default store;