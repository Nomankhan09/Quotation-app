import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardSummary } from "@/services/dashboardService";
import { RootState } from "..";

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }
      const data = await getDashboardSummary(token);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Error fetching dashboard");
    }
  }
);

interface DashboardState {
  total_leads: number;
  total_products: number;
  total_categories: number;
  total_conversions: number;
  total_deals: number;
  recent_leads: any[];
  loading: boolean;
  recent_tasks: any[];
}

const initialState: DashboardState = {
  total_leads: 0,
  total_products: 0,
  total_categories: 0,
  total_conversions: 0,
  total_deals: 0,
  recent_leads: [],
  loading: false,
  recent_tasks: [],
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.total_leads = action.payload.total_leads;
        state.total_products = action.payload.total_products;
        state.total_categories = action.payload.total_categories;
        state.total_conversions = action.payload.total_conversions;
        state.recent_leads = action.payload.recent_leads || [];
        state.recent_tasks = action.payload.recent_tasks || [];
        state.total_deals = action.payload.total_deals;
      })
      .addCase(fetchDashboardSummary.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default dashboardSlice.reducer;
