import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authSlice from './slices/authSlice';
import leadsSlice from './slices/leadsSlice';
import productsSlice from './slices/productsSlice';
import categoriesSlice from './slices/categoriesSlice';
import followUpSlice from './slices/followUpSlice';
import quotationsSlice from './slices/quotationsSlice';
import quotationBuilderSlice from './slices/quotationBuilderSlice';
import dashboardSlice from './slices/dashboardSlice';
import specificationsSlice from './slices/specificationsSlice';
import contactStatusReducer from './slices/contactStatusSlice';

// Persist config
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Add quotationBuilder to the whitelist
  whitelist: ['auth', 'quotationBuilder'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  leads: leadsSlice,
  products: productsSlice,
  categories: categoriesSlice,
  followUp: followUpSlice,
  quotations: quotationsSlice,
  quotationBuilder: quotationBuilderSlice,
  dashboard: dashboardSlice,
  specifications: specificationsSlice,
  contactStatus: contactStatusReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;