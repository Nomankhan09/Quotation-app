import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { createSpecification, fetchSpecifications } from '@/services/specificationsService';

// ================= TYPES =================

export interface Specification {
  id: string;
  item: string;
  description: { description: string }[];
  created_at: string;
}

interface SpecificationsState {
  specifications: Specification[];
  loading: boolean;
  search: string;
  initialized: boolean;
}

const initialState: SpecificationsState = {
  specifications: [],
  loading: false,
  search: "",
  initialized: false,
};

// ================= THUNKS =================

// 🔥 Load all specifications (with pagination)
export const loadAllSpecifications = createAsyncThunk(
  "specifications/loadAllSpecifications",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      let allSpecifications: Specification[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetchSpecifications(page, "", 50, token);
        const data = res.data;

        allSpecifications = [...allSpecifications, ...data.data];
        hasMore = allSpecifications.length < data.total;
        page++;
      }

      return allSpecifications;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🔥 Add specification
export const addSpecification = createAsyncThunk(
  "specifications/addSpecification",
  async (
    payload: {
      item: string;
      description: { description: string }[];
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const newSpecification = await createSpecification(payload, token);
      return newSpecification;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ================= SLICE =================

const specificationsSlice = createSlice({
  name: 'specifications',
  initialState,
  reducers: {
    setSpecificationSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearSpecifications: (state) => {
      state.specifications = [];
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder

      // 🔄 LOAD ALL
      .addCase(loadAllSpecifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllSpecifications.fulfilled, (state, action) => {
        state.loading = false;
        state.specifications = action.payload;
        state.initialized = true;
      })
      .addCase(loadAllSpecifications.rejected, (state) => {
        state.loading = false;
        state.initialized = false;
      })

      // ➕ ADD
      .addCase(addSpecification.fulfilled, (state, action) => {
        const payload = action.payload;

        if (!payload || !payload.id || !payload.item) {
          return;
        }

        const exists = state.specifications.some(
          (s) => String(s.id) === String(payload.id)
        );

        if (!exists) {
          state.specifications.unshift(payload);
        }
      });
  },
});

// ================= EXPORTS =================

export const {
  setSpecificationSearch,
  clearSpecifications,
} = specificationsSlice.actions;

export default specificationsSlice.reducer;