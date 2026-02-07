import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useSelector, TypedUseSelectorHook, useDispatch } from 'react-redux';
import { persistStore, persistReducer, PersistConfig, createMigrate, PersistState } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';

import settings from './settings';
import music, { initialState as musicInitialState } from './music';
import downloads, { initialState as downloadsInitialState } from './downloads';
import sleepTimer from './sleep-timer';
import search from './search';
import { ColorScheme } from './settings/types';
import MigratedStorage from '@/utility/MigratedStorage';
import { initializeDatabaseSchema } from './database';

const persistConfig: PersistConfig<Omit<AppState, '_persist'>> = {
    key: 'root',
    storage: MigratedStorage,
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
        // 4: (state: AppState) => {
        //     return {
        //         ...state,
        //         sleepTimer: {
        //             date: null,
        //         }
        //     };
        // },
        // @ts-expect-error migrations are poorly typed
        5: (state: AppState) => {
            // @ts-expect-error
            const credentials = state.settings.jellyfin && { 
                // @ts-expect-error
                ...(state.settings.jellyfin as AppState['settings']['credentials']),
                type: 'jellyfin',
            };

            return {
                ...state,
                settings: {
                    ...state.settings,
                    credentials,
                },
            };
        },
    })
};

const reducers = combineReducers({
    settings,
    music: music.reducer,
    downloads: downloads.reducer,
    sleepTimer: sleepTimer.reducer,
    search: search.reducer,
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

// Initialize database schema
// This runs asynchronously and doesn't block store initialization
// App will work normally even if database initialization fails
initializeDatabaseSchema()
    .then(() => {
        console.log('[Store] Database initialized successfully');
    })
    .catch((error) => {
        console.error('[Store] Database initialization failed:', error);
    });

export default store;