import { configureStore, getDefaultMiddleware, combineReducers } from '@reduxjs/toolkit';
import { useSelector, TypedUseSelectorHook, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
// import logger from 'redux-logger';

const persistConfig: PersistConfig<AppState> = {
    key: 'root',
    storage: AsyncStorage,
    stateReconciler: autoMergeLevel2
};

import settings from './settings';
import music from './music';
import player from './player';

const reducers = combineReducers({
    settings,
    player: player.reducer,
    music: music.reducer,
});

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
        // logger
    ),
});

export type AppState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
export type AsyncThunkAPI = { state: AppState, dispatch: AppDispatch };
export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const persistedStore = persistStore(store);

export default store;