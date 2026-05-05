import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";
import { fetchCallLogs, createCallLog, deleteCallLog } from "@/services/callLogService";

export interface CallLog {
    id: number;
    duration: number;
    type: "INCOMING" | "OUTGOING" | "MISSED";
    lead_id: number;
    user_id: number;
    timestamp: string;
    created_at: string;
}

interface CallLogState {
    logs: CallLog[];
    loading: boolean;
    initialized: boolean;
    filters: {
        type?: string;
        lead_id?: number;
    };
}

const initialState: CallLogState = {
    logs: [],
    loading: false,
    initialized: false,
    filters: {},
};

export const loadCallLogs = createAsyncThunk(
    "callLogs/loadCallLogs",
    async (
        filters: { type?: string; lead_id?: number },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) {
                return rejectWithValue("No authentication token found");
            }

            const data = await fetchCallLogs(filters, token);

            return data; // direct array
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


export const addCallLog = createAsyncThunk(
    "callLogs/addCallLog",
    async (
        payload: {
            duration: number;
            type: "INCOMING" | "OUTGOING" | "MISSED";
            lead_id: number;
            timestamp: string;
        },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const newLog = await createCallLog(payload, token);
            return newLog.data;
        } catch (err: any) {
            console.log('err', err.response);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const removeCallLog = createAsyncThunk(
    "callLogs/removeCallLog",
    async (id: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            await deleteCallLog(id, token);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


const callLogSlice = createSlice({
    name: "callLogs",
    initialState,
    reducers: {
        setCallLogFilters: (state, action: PayloadAction<any>) => {
            state.filters = action.payload;
        },
        clearCallLogs: (state) => {
            state.logs = [];
            state.initialized = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // LOAD
            .addCase(loadCallLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadCallLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload;
                state.initialized = true;
            })
            .addCase(loadCallLogs.rejected, (state) => {
                state.loading = false;
                state.initialized = false;
            })

            // ADD
            .addCase(addCallLog.fulfilled, (state, action) => {
                const payload = action.payload;

                if (!payload || !payload.id) return;

                const exists = state.logs.some(
                    (log) => log.id === payload.id
                );

                if (!exists) {
                    state.logs.unshift(payload);
                }
            })

            // DELETE
            .addCase(removeCallLog.fulfilled, (state, action) => {
                state.logs = state.logs.filter(
                    (log) => log.id !== action.payload
                );
            });
    },
});

export const { setCallLogFilters, clearCallLogs } = callLogSlice.actions;
export default callLogSlice.reducer;