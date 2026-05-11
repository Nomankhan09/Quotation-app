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
    fetchTasksStatus,
    fetchTasksPriority,
} from '@/services/taskService';
import { Lead } from './leadsSlice';

export interface ITaskPriority {
    id: number;
    priority: string;
    color: string;
    icon: string;
}

export interface ITask {
    id: number;
    user_id: number;
    contact_id: number;
    title: string;
    status: 'pending' | 'completed';
    due_date: string;
    priority: ITaskPriority | null;
    notes: string | null;
    notification_id: string | null;
    created_at: string;
    updated_at: string;
    contact: Lead;
}

export interface ITaskStatus {
    id: number;
    status: string;
    color: string;
}


interface TaskState {
    tasks: ITask[];
    loading: boolean;
    task_status: ITaskStatus[];
    task_priority: ITaskPriority[];
    initialized: boolean;
}

const initialState: TaskState = {
    tasks: [],
    loading: false,
    task_status: [],
    task_priority: [],
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
    async (_, { getState, rejectWithValue }) => {
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
            console.log('add task -> ', err.response);
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
            console.log('edit task -> ', err.response);
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

// ─── LOAD TASK STATUS ─────────────────────────────────────────────────────────────
export const loadTasksStatus = createAsyncThunk(
    'tasks/loadTasksStatus',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No authentication token');
            return await fetchTasksStatus(token);
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ─── LOAD TASK PRIORITY ─────────────────────────────────────────────────────────────
export const loadTasksPriority = createAsyncThunk(
    'tasks/loadTasksPriority',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (!token) return rejectWithValue('No authentication token');
            return await fetchTasksPriority(token);
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
            })

            // LOAD TASK STATUS
            .addCase(loadTasksStatus.pending, (state) => { state.loading = true; })
            .addCase(loadTasksStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.task_status = action.payload?.data ?? [];
                state.initialized = true;
            })
            .addCase(loadTasksStatus.rejected, (state) => { state.loading = false; })

            // LOAD TASK PRIORITY
            .addCase(loadTasksPriority.pending, (state) => { state.loading = true; })
            .addCase(loadTasksPriority.fulfilled, (state, action) => {
                state.loading = false;
                state.task_priority = action.payload?.data ?? [];
                state.initialized = true;
            })
            .addCase(loadTasksPriority.rejected, (state) => { state.loading = false; });
    },
});

export const { clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;