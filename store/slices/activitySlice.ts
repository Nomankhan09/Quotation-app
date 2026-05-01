import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { fetchLeadActivity } from '@/services/activityService';

export interface IActivity {
    id: number;
    user_id: number;
    lead_id: number;
    title: string;
    type: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface ActivityState {
    logs: IActivity[];
    loading: boolean;
    initialized: boolean;
}

const initialState: ActivityState = {
    logs: [],
    loading: false,
    initialized: false,
};


// ─── LOAD BY LEAD ─────────────────────────────────────
export const loadActivityByLead = createAsyncThunk(
    'activity/loadActivityByLead',
    async (leadId: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No authentication token');

            const data = await fetchLeadActivity(token, leadId);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── SLICE ─────────────────────────────────────
const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        clearActivity: (state) => {
            state.logs = [];
            state.initialized = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadActivityByLead.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadActivityByLead.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload.activity;
                state.initialized = true;
            })
            .addCase(loadActivityByLead.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { clearActivity } = activitySlice.actions;
export default activitySlice.reducer;