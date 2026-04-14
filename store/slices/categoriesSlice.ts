import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchCategories, createCategory } from '@/services/categoriesService';
import { RootState } from '..';

export interface Category {
  id: string;
  category_name: string;
  description: string;
  color: string;
  created_at: string;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  search: string;
  initialized: boolean;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  search: "",
  initialized: false,
};

// Load all categories with pagination
export const loadAllCategories = createAsyncThunk(
  "categories/loadAllCategories",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      let allCategories: Category[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchCategories(page, "", 50, token);
        allCategories = [...allCategories, ...data.data];
        hasMore = allCategories.length < data.total;
        page++;
      }

      return allCategories;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addCategory = createAsyncThunk(
  "categories/addCategory",
  async (categoryData: { category_name: string; description?: string, color: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");
      const newCategory = await createCategory(categoryData, token);
      return newCategory;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategorySearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearCategories: (state) => {
      state.categories = [];
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.initialized = true;
      })
      .addCase(loadAllCategories.rejected, (state) => {
        state.loading = false;
        state.initialized = false;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        const payload = action.payload;

        if (!payload || !payload.id || !payload.category_name) {
          return;
        }

        const exists = state.categories.some(
          (c) => String(c.id) === String(payload.id)
        );

        if (!exists) {
          state.categories.unshift(payload);
        }
      });
  },
});

export const { setCategorySearch, clearCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;