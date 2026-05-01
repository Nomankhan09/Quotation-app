import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { INote, INotePayload } from '@/interface/notes';
import { createLeadNote, deleteNoteById, fetchLeadNotes, fetchNotesByLead, updateLeadNote } from '@/services/notesService';

interface NotesState {
    notes: INote[];
    loading: boolean;
    initialized: boolean;
}

const initialState: NotesState = {
    notes: [],
    loading: false,
    initialized: false,
};


// ─── LOAD ALL ─────────────────────────────────────
export const loadNotes = createAsyncThunk(
    'notes/loadNotes',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No authentication token');

            const data = await fetchLeadNotes(token);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── LOAD BY LEAD ─────────────────────────────────────
export const loadNotesByLead = createAsyncThunk(
    'notes/loadNotesByLead',
    async (contactId: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No authentication token');

            const data = await fetchNotesByLead(token, contactId);
            return data;
        } catch (err: any) {
            console.log('DATA:', err.response?.data);
            console.log('FULL ERROR:', JSON.stringify(err.response?.data, null, 2));
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── CREATE ─────────────────────────────────────
export const addNote = createAsyncThunk(
    'notes/addNote',
    async (payload: INotePayload, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No token');

            const data = await createLeadNote(payload, token);
            return data;
        } catch (err: any) {
            console.log('DATA:', err.response?.data);
            console.log('FULL ERROR:', JSON.stringify(err.response?.data, null, 2));
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── DELETE ─────────────────────────────────────
export const removeNote = createAsyncThunk(
    'notes/removeNote',
    async (id: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No token');

            await deleteNoteById(token, Number(id));
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── UPDATE ─────────────────────────────────────
export const editNote = createAsyncThunk(
    'notes/editNote',
    async (
        { id, data }: { id: string; data: INotePayload },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue('No token');

            const updated = await updateLeadNote(id, data, token);
            return updated;
        } catch (err: any) {
            console.log('DATA:', err.response?.data);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// ─── SLICE ─────────────────────────────────────
const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        clearNotes: (state) => {
            state.notes = [];
            state.initialized = false;
        },
    },
    extraReducers: (builder) => {
        builder

            // LOAD ALL
            .addCase(loadNotes.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadNotes.fulfilled, (state, action) => {
                state.loading = false;
                state.notes = action.payload.notes;
                state.initialized = true;
            })
            .addCase(loadNotes.rejected, (state) => {
                state.loading = false;
            })

            // LOAD BY LEAD
            .addCase(loadNotesByLead.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadNotesByLead.fulfilled, (state, action) => {
                state.loading = false;
                state.notes = action.payload.notes;
                state.initialized = true;
                console.log('notes log -> ', action.payload)
            })
            .addCase(loadNotesByLead.rejected, (state) => {
                state.loading = false;
            })

            // CREATE
            .addCase(addNote.fulfilled, (state, action) => {
                state.notes.unshift(action.payload.note);
            })

            .addCase(removeNote.fulfilled, (state, action) => {
                const deletedId = action.meta.arg; // 👈 this is what you passed to dispatch

                state.notes = state.notes.filter(
                    (note) => String(note.id) !== String(deletedId)
                );
            })

            // UPDATE
            .addCase(editNote.fulfilled, (state, action) => {
                const updated = action.payload.note;
                const index = state.notes.findIndex(n => n.id === updated.id);
                if (index !== -1) {
                    state.notes[index] = updated;
                }
            });
    },
});

export const { clearNotes } = notesSlice.actions;
export default notesSlice.reducer;