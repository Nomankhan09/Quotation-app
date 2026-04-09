import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { updateCompanyInfo, CompanyInfoRequest } from "@/services/authService";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  company_address?: string;
  zip_code?: string;
  company_phone?: string;
  website?: string;
  company_logo?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  updatingCompany: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  updatingCompany: false,
};

// Async thunk for updating company information
export const updateCompanyInformation = createAsyncThunk(
  "auth/updateCompanyInformation",
  async (companyData: CompanyInfoRequest, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await updateCompanyInfo(companyData, token);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update company information");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Update company information
      .addCase(updateCompanyInformation.pending, (state) => {
        state.updatingCompany = true;
        state.error = null;
      })
      .addCase(updateCompanyInformation.fulfilled, (state, action) => {
        state.updatingCompany = false;
        state.user = action.payload.user;
      })
      .addCase(updateCompanyInformation.rejected, (state, action) => {
        state.updatingCompany = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  updateUser 
} = authSlice.actions;
export default authSlice.reducer;