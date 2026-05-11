import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { fetchContactStatuses } from '@/services/leadsService';

export interface ContactStatus {
    id: string;
    status: string;
    color: string;
}

interface ContactStatusState {
    statuses: ContactStatus[];
    loading: boolean;
    initialized: boolean;
}

const initialState: ContactStatusState = {
    statuses: [],
    loading: false,
    initialized: false,
};

// ─── THUNK ─────────────────────────────────────────────
export const loadStatuses = createAsyncThunk(
    "contactStatus/loadStatuses",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue("No token found");
            }

            return await fetchContactStatuses(token);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ─── SLICE ─────────────────────────────────────────────
const contactStatusSlice = createSlice({
    name: "contactStatus",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadStatuses.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadStatuses.fulfilled, (state, action) => {
                state.loading = false;
                state.statuses = action.payload;
                state.initialized = true;
            })
            .addCase(loadStatuses.rejected, (state) => {
                state.loading = false;
                state.initialized = false;
            });
    },
});

export default contactStatusSlice.reducer;