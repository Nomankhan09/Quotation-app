import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
    fetchAllTasks,
    fetchTasksByLead,
    createTask,
    updateTask,
    deleteTask,
    ITaskPayload,
    fetchTodayTask,
} from '@/services/taskService';

export interface ITask {
    id: number;
    user_id: number;
    contact_id: number;
    title: string;
    status: 'pending' | 'completed';
    due_date: string;
    priority: 'Low' | 'Medium' | 'High' | null;
    notes: string | null;
    notification_id: string | null;
    created_at: string;
    updated_at: string;
}

interface TaskState {
    tasks: ITask[];
    loading: boolean;
    initialized: boolean;
}

const initialState: TaskState = {
    tasks: [],
    loading: false,
    initialized: false,
};


// ─── LOAD ALL ─────────────────────────────────────────────────────────────────
export const loadTasks = createAsyncThunk(
    'tasks/loadTasks',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No authentication token');
            return await fetchAllTasks(token);
        } catch (err: any) {
            console.log('load task err', err.response);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── LOAD BY LEAD ─────────────────────────────────────────────────────────────
export const loadTasksByLead = createAsyncThunk(
    'tasks/loadTasksByLead',
    async (leadId: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No authentication token');
            return await fetchTasksByLead(token, leadId);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ─── LOAD TODAY LEAD ─────────────────────────────────────────────────────────────
export const loadTodayTasks = createAsyncThunk(
    'tasks/loadTodayTasks',
    async (_,{ getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No authentication token');
            return await fetchTodayTask(token);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const addTask = createAsyncThunk(
    'tasks/addTask',
    async (payload: ITaskPayload, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No token');
            return await createTask(payload, token);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const editTask = createAsyncThunk(
    'tasks/editTask',
    async (
        { id, data }: { id: string; data: Partial<ITaskPayload> },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No token');
            return await updateTask(id, data, token);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── DELETE ───────────────────────────────────────────────────────────────────
export const removeTask = createAsyncThunk(
    'tasks/removeTask',
    async (id: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No token');
            await deleteTask(id, token);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── SLICE ────────────────────────────────────────────────────────────────────
const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        clearTasks: (state) => {
            state.tasks = [];
            state.initialized = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // LOAD ALL
            .addCase(loadTasks.pending, (state) => { state.loading = true; })
            .addCase(loadTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload?.tasks ?? []; // ✅ fallback
                state.initialized = true;
            })
            .addCase(loadTasks.rejected, (state) => { state.loading = false; })

            // LOAD BY LEAD
            .addCase(loadTasksByLead.pending, (state) => { state.loading = true; })
            .addCase(loadTasksByLead.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload?.tasks ?? []; // ✅ fallback
                state.initialized = true;
            })
            .addCase(loadTasksByLead.rejected, (state) => { state.loading = false; })

            // LOAD Today LEAD TASK
            .addCase(loadTodayTasks.pending, (state) => { state.loading = true; })
            .addCase(loadTodayTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload?.tasks ?? []; // ✅ fallback
                state.initialized = true;
            })
            .addCase(loadTodayTasks.rejected, (state) => { state.loading = false; })

            // CREATE
            .addCase(addTask.fulfilled, (state, action) => {
                state.tasks.unshift(action.payload.task);
            })

            // UPDATE
            .addCase(editTask.fulfilled, (state, action) => {
                const updated: ITask = action.payload.task;
                const index = state.tasks.findIndex(t => t.id === updated.id);
                if (index !== -1) state.tasks[index] = updated;
            })

            // DELETE
            .addCase(removeTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(t => String(t.id) !== action.payload);
            });
    },
});

export const { clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;