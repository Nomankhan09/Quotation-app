import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";
import {
    fetchDeals,
    fetchDealById,
    createDeal,
    updateDeal,
    Deal,
    DealFilters,
    CreateDealPayload,
    UpdateDealPayload,
    fetchDealStages,
    DealStage,
    updateDealStage,
    UpdateDealStagePayload,
} from "@/services/dealService";

// ─── State ────────────────────────────────────────────────────────────────────

interface DealState {
    deals: Deal[];
    deal_stage: DealStage[];
    deal_stage_loading: boolean;
    selectedDeal: Deal | null;
    loading: boolean;
    dealLoading: boolean;
    selectedDealLoading: boolean;
    submitting: boolean;
    initialized: boolean;
    filters: DealFilters;
    error: string | null;
    initialLoadDone: boolean;
    stagesInitialized: boolean;
}

const initialState: DealState = {
    deals: [],
    deal_stage: [],
    deal_stage_loading: false,
    selectedDeal: null,
    loading: false,
    dealLoading: false,
    selectedDealLoading: false,
    submitting: false,
    initialized: false,
    filters: {},
    error: null,
    initialLoadDone: false,
    stagesInitialized: false,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loadDeals = createAsyncThunk(
    "deals/loadDeals",
    async (filters: DealFilters, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const data = await fetchDeals(filters, token);
            return data; // direct array
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const loadDealById = createAsyncThunk(
    "deals/loadDealById",
    async (id: number, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const data = await fetchDealById(id, token);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const addDeal = createAsyncThunk(
    "deals/addDeal",
    async (payload: CreateDealPayload, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const newDeal = await createDeal(payload, token);
            return newDeal.data;
        } catch (err: any) {
            console.log("addDeal error:", err.response);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const editDeal = createAsyncThunk(
    "deals/editDeal",
    async (
        { id, payload }: { id: number; payload: UpdateDealPayload },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const updated = await updateDeal(id, payload, token);
            return updated.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const loadDealStage = createAsyncThunk(
    "deals/loadDealsStage",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const data = await fetchDealStages(token);
            return data; // direct array
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const editDealStage = createAsyncThunk(
    "deals/editDealStage",
    async (
        { id, payload }: { id: number; payload: UpdateDealStagePayload },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;

            if (!token) return rejectWithValue("No authentication token found");

            const updated = await updateDealStage(id, payload, token);
            return updated.data;
        } catch (err: any) {
            console.log('deal stage -> ', err.response)
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const dealSlice = createSlice({
    name: "deals",
    initialState,
    reducers: {
        setDealFilters: (state, action: PayloadAction<DealFilters>) => {
            state.filters = action.payload;
        },
        setSelectedDeal: (state, action: PayloadAction<Deal | null>) => {
            state.selectedDeal = action.payload;
        },
        clearDeals: (state) => {
            state.deals = [];
            state.initialized = false;
            state.error = null;
        },
        clearDealError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── LOAD ALL ──────────────────────────────────────────────────────
            .addCase(loadDeals.pending, (state) => {
                state.dealLoading = true;
                state.error = null;
            })
            .addCase(loadDeals.fulfilled, (state, action) => {
                state.dealLoading = false;
                state.initialLoadDone = true;
                state.deals = action.payload;
                state.initialized = true;
            })
            .addCase(loadDeals.rejected, (state, action) => {
                state.dealLoading = false;
                state.initialized = false;
                state.initialLoadDone = true;
                state.error = action.payload as string;
            })

            // ── LOAD BY ID ────────────────────────────────────────────────────
            .addCase(loadDealById.pending, (state) => {
                state.selectedDealLoading = true;
                state.error = null;
            })
            .addCase(loadDealById.fulfilled, (state, action) => {
                state.selectedDealLoading = false;
                state.selectedDeal = action.payload;
            })
            .addCase(loadDealById.rejected, (state, action) => {
                state.selectedDealLoading = false;
                state.error = action.payload as string;
            })

            // ── ADD ───────────────────────────────────────────────────────────
            .addCase(addDeal.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(addDeal.fulfilled, (state, action) => {
                state.submitting = false;
                const payload = action.payload;
                if (!payload || !payload.id) return;

                const exists = state.deals.some((d) => d.id === payload.id);
                if (!exists) {
                    state.deals.unshift(payload); // newest first
                }
            })
            .addCase(addDeal.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload as string;
            })

            // ── EDIT ──────────────────────────────────────────────────────────
            .addCase(editDeal.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(editDeal.fulfilled, (state, action) => {
                state.submitting = false;
                const updated = action.payload;
                if (!updated) return;

                const idx = state.deals.findIndex((d) => d.id === updated.id);
                if (idx !== -1) state.deals[idx] = updated;

                if (state.selectedDeal?.id === updated.id) {
                    state.selectedDeal = updated;
                }
            })
            .addCase(editDeal.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload as string;
            })

            // Load deal stage
            .addCase(loadDealStage.pending, (state) => {
                state.deal_stage_loading = true;
                state.error = null;
            })
            .addCase(loadDealStage.fulfilled, (state, action) => {
                state.deal_stage_loading = false;
                state.deal_stage = action.payload;
                state.initialized = true;
                state.stagesInitialized = true;
            })
            .addCase(loadDealStage.rejected, (state, action) => {
                state.deal_stage_loading = false;
                state.initialized = false;
                state.stagesInitialized = false;
                state.error = action.payload as string;
            })

            // edit deal stage
            .addCase(editDealStage.pending, (state) => {
                state.submitting = true;
            })
            .addCase(editDealStage.fulfilled, (state, action) => {
                state.submitting = false;

                const updated = action.payload;

                const idx = state.deals.findIndex(d => d.id === updated.id);

                if (idx !== -1) {
                    // 🔥 update only stage_id (and optionally stage object)
                    state.deals[idx].stage_id = updated.stage_id;

                    // optional if backend returns relation
                    if (updated.stage) {
                        state.deals[idx].stage = updated.stage;
                    }
                }

                // update selected deal if open
                if (state.selectedDeal?.id === updated.id) {
                    state.selectedDeal = updated;
                }
            })
            .addCase(editDealStage.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload as string;
            });
    },
});

export const { setDealFilters, setSelectedDeal, clearDeals, clearDealError } =
    dealSlice.actions;

export default dealSlice.reducer;