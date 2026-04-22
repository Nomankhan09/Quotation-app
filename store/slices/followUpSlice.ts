import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { IFollowUp, IFollowUpPayload } from '@/interface/followUp';
import { createFollowUp, deleteFollowUp, fetchFollowUps, fetchFollowUpsByLead, updateFollowUp } from '@/services/followUpsService';

interface FollowUpState {
    followUps: IFollowUp[];
    loading: boolean;
    initialized: boolean;
}

const initialState: FollowUpState = {
    followUps: [],
    loading: false,
    initialized: false,
};


// ─── LOAD ALL ─────────────────────────────────────
export const loadFollowUps = createAsyncThunk(
    "followUps/loadFollowUps",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue("No authentication token");
            }

            const data = await fetchFollowUps(token);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// LOAD BY LEAD
export const loadFollowUpsByLead = createAsyncThunk(
    "followUps/loadFollowUps",
    async (leadId: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue("No authentication token");
            }

            const data = await fetchFollowUpsByLead(token, leadId);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── CREATE ─────────────────────────────────────
export const addFollowUp = createAsyncThunk(
    "followUps/addFollowUp",
    async (payload: IFollowUpPayload, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No token");

            const data = await createFollowUp(payload, token);
            return data;
        } catch (err: any) {
            console.log('DATA:', err.response?.data);
            console.log('FULL ERROR:', JSON.stringify(err.response?.data, null, 2));
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── DELETE ─────────────────────────────────────
export const removeFollowUp = createAsyncThunk(
    "followUps/removeFollowUp",
    async (id: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No token");

            await deleteFollowUp(id, token);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── UPDATE ─────────────────────────────────────
export const editFollowUp = createAsyncThunk(
    "followUps/editFollowUp",
    async (
        { id, data }: { id: string; data: IFollowUpPayload },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No token");

            const updated = await updateFollowUp(id, data, token);
            return updated;
        } catch (err: any) {
            console.log('DATA:', err.response?.data);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── SLICE ─────────────────────────────────────
const followUpSlice = createSlice({
    name: 'followUps',
    initialState,
    reducers: {
        clearFollowUps: (state) => {
            state.followUps = [];
            state.initialized = false;
        },
    },
    extraReducers: (builder) => {
        builder

            // LOAD
            .addCase(loadFollowUps.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadFollowUps.fulfilled, (state, action) => {
                state.loading = false;
                state.followUps = action.payload.follow_ups;
                state.initialized = true;
            })
            .addCase(loadFollowUps.rejected, (state) => {
                state.loading = false;
            })

            // CREATE
            .addCase(addFollowUp.fulfilled, (state, action) => {
                const payload = action.payload;
                state.followUps.unshift(payload.follow_up);
            })

            // DELETE
            .addCase(removeFollowUp.fulfilled, (state, action) => {
                state.followUps = state.followUps.filter(
                    f => f.id !== action.payload
                );
            })

            // UPDATE
            .addCase(editFollowUp.fulfilled, (state, action) => {
                const updated = action.payload.follow_up;

                const index = state.followUps.findIndex(
                    f => f.id === updated.id
                );

                if (index !== -1) {
                    state.followUps[index] = updated;
                }
            });
    },
});

export const { clearFollowUps } = followUpSlice.actions;
export default followUpSlice.reducer;