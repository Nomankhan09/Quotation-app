import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { createQuotation, updateQuotation, fetchQuotations } from '@/services/quotationService';
import { RootState } from '..';

export interface Quotation {
  id: string;
  quotationNumber: string;
  leadId: string;
  productIds: string[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  created_at: string;
  notes?: string;
}

interface QuotationsState {
  quotations: Quotation[];
  loading: boolean;
  loadingMore: boolean;
  search: string;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    hasMorePages: boolean;
  };
}

const initialState: QuotationsState = {
  quotations: [],
  loading: false,
  loadingMore: false,
  search: '',
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 5,
    total: 0,
    hasMorePages: false,
  },
};

export const saveQuotation = createAsyncThunk(
  "quotations/saveQuotation",
  async (quotationData: any, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) {
      return rejectWithValue("No authentication token found");
    }
    try {
      const response = await createQuotation(quotationData, token);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const editQuotation = createAsyncThunk(
  "quotations/editQuotation",
  async ({ id, quotationData }: { id: number; quotationData: any }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) {
      return rejectWithValue("No authentication token found");
    }
    const response = await updateQuotation(id, quotationData, token);
    return response;
  }
);

export const getQuotations = createAsyncThunk(
  "quotations/getQuotations",
  async ({ page = 1, search = '', loadMore = false }: { page?: number; search?: string; loadMore?: boolean } = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) {
      return rejectWithValue("No authentication token found");
    }
    const response = await fetchQuotations(token, page, search);
    return { quotations: response.quotations ?? [],
  pagination: response.pagination, loadMore, search };
  }
);




const quotationsSlice = createSlice({
  name: 'quotations',
  initialState,
  reducers: {
    addQuotation: (state, action: PayloadAction<Omit<Quotation, 'id' | 'created_at' | 'quotationNumber'>>) => {
      const newQuotation: Quotation = {
        ...action.payload,
        id: Date.now().toString(),
        quotationNumber: `QUO-${new Date().getFullYear()}-${String(state.quotations.length + 1).padStart(3, '0')}`,
        created_at: new Date().toISOString(),
      };
      state.quotations.unshift(newQuotation);
    },
    updateQuotationStatus: (state, action: PayloadAction<{ id: string; status: Quotation['status'] }>) => {
      const quotation = state.quotations.find(q => q.id === action.payload.id);
      if (quotation) {
        quotation.status = action.payload.status;
      }
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearQuotations: (state) => {
      state.quotations = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Quotations
      .addCase(getQuotations.pending, (state, action) => {
        const { loadMore } = action.meta.arg;
        if (loadMore) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
      })
      .addCase(getQuotations.fulfilled, (state, action) => {
        const { loadMore } = action.meta.arg;
        const responseData = action.payload;
        
        if (loadMore) {
          state.loadingMore = false;
        } else {
          state.loading = false;
        }
        
        if (responseData && responseData.quotations) {
          const formattedQuotations = responseData.quotations.map((q: any) => ({
            id: q.id?.toString(),
            quotationNumber: q.quotationNumber,
            leadId: q.leadId?.toString(),
            productIds: q.productIds || [],
            totalAmount: Number(q.totalAmount || 0),
            status: q.status || "draft",
            validUntil: q.validUntil,
            created_at: q.created_at,
            notes: q.notes || "",
          }));

          if (loadMore) {
            // Append to existing quotations for load more
            state.quotations = [...state.quotations, ...formattedQuotations];
          } else {
            // Replace quotations for new search or initial load
            state.quotations = formattedQuotations;
          }
        } else if (!loadMore) {
          state.quotations = [];
        }

        // Update pagination info
        if (responseData.pagination) {
          state.pagination = {
            currentPage: responseData.pagination.current_page,
            lastPage: responseData.pagination.last_page,
            perPage: responseData.pagination.per_page,
            total: responseData.pagination.total,
            hasMorePages: responseData.pagination.has_more_pages,
          };
        }
      })
      .addCase(getQuotations.rejected, (state, action) => {
        const { loadMore } = action.meta.arg;
        if (loadMore) {
          state.loadingMore = false;
        } else {
          state.loading = false;
        }
      })
      .addCase(editQuotation.fulfilled, (state, action) => {
  const q = action.payload;

  const updatedQuotation: Quotation = {
    id: q.id.toString(),
    quotationNumber: q.quotationNumber,
    leadId: q.leadId?.toString(),
    productIds: q.productIds || [],
    totalAmount: Number(q.totalAmount || 0),
    status: q.status || 'draft',
    validUntil: q.validUntil,
    created_at: q.created_at,
    notes: q.notes || '',
  };

  const index = state.quotations.findIndex(
    item => item.id === updatedQuotation.id
  );

  if (index !== -1) {
    state.quotations[index] = updatedQuotation;
  }
})


      
  },
});




export const { addQuotation, updateQuotationStatus, setSearch, clearQuotations } = quotationsSlice.actions;
export default quotationsSlice.reducer;