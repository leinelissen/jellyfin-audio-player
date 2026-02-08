import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useSelector, TypedUseSelectorHook, useDispatch } from 'react-redux';
import { persistStore, persistReducer, PersistConfig, createMigrate, PersistState } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';

import settings from './settings';
import sleepTimer from './sleep-timer';
import search from './search';
import { ColorScheme } from './settings/types';
import MigratedStorage from '@/utility/MigratedStorage';

const persistConfig: PersistConfig<Omit<AppState, '_persist'>> = {
    key: 'root',
    storage: MigratedStorage,
    version: 6,
    stateReconciler: autoMergeLevel2,
    migrate: createMigrate({
        // @ts-expect-error migrations are poorly typed
        6: (state: AppState & PersistState) => {
            // Migration v6: Remove music and downloads from Redux
            // These are now database-backed only. Intentionally discarding
            // old Redux state as data is persisted in SQLite database.
            return {
                settings: state.settings,
                sleepTimer: state.sleepTimer,
                search: state.search,
            };
        },
    })
};

const reducers = combineReducers({
    settings,
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

export default store;