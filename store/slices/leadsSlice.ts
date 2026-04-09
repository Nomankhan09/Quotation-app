import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchLeads, createLead } from "@/services/leadsService";
import { RootState } from "..";

export interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  created_at: string;
  notes?: string;
}

interface LeadsState {
  leads: Lead[];
  loading: boolean;
  search: string;
  initialized: boolean;
}

const initialState: LeadsState = {
  leads: [],
  loading: false,
  search: "",
  initialized: false,
};

// Load all leads with pagination
export const loadAllLeads = createAsyncThunk(
  "leads/loadAllLeads",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      console.log("Current auth token in leadsSlice:", token);
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      let allLeads: Lead[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchLeads(page, "", 50, token); // Increased page size
        allLeads = [...allLeads, ...data.data];
        hasMore = allLeads.length < data.total;
        page++;
      }

      return allLeads;
    } catch (err: any) {
      console.log("Error fetching leads:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addLead = createAsyncThunk(
  "leads/addLead",
  async (leadData: {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    notes?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");
      const newLead = await createLead(leadData, token);
      return newLead;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearLeads: (state) => {
      state.leads = [];
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllLeads.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload;
        state.initialized = true;
      })
      .addCase(loadAllLeads.rejected, (state) => {
        state.loading = false;
        state.initialized = false;
      })
      .addCase(addLead.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      });
  },
});

export const { clearLeads, setSearch } = leadsSlice.actions;
export default leadsSlice.reducer;