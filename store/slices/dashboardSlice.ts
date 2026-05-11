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

export interface DashboardData {
  total_leads: number;
  total_products: number;
  total_categories: number;
  total_conversions: number;
  total_deals: number;
  recent_leads: any[];
  recent_tasks: any[] | null;
  active_deals: number;
  won_deals: number;
  total_revenue: number;
  pipeline_overview: any[];
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
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
        state.data = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default dashboardSlice.reducer;
