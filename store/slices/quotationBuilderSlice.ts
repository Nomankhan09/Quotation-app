import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchTerms, createTerm, deleteTerm } from '@/services/termsService';
import { fetchPaymentTerms, createPaymentTerm, deletePaymentTerm } from '@/services/paymentTermsService';
import { RootState } from '@/store';
import { fetchSpecifications } from '@/services/specificationsService';



export interface SelectedProduct {
  productId: string;
  product_name: string;        // ✅ ADD
  categoryId: string;          // ✅ ADD
  categoryName: string;        // ✅ ADD
  unitPrice: number;
  length: number;
  width: number;
  quantity: number;
  unit: 'feet' | 'inches';
  totalPrice: number;
}

export interface Term {
  id: string;
  text: string;
}

export interface PaymentTerm {
  id: string;
  description: string;
  value: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}


interface QuotationBuilderState {
  selectedLead: string | null;
  selectedProducts: SelectedProduct[];
  discount: Discount;
  terms: Term[];
  selectedTerms: string[];
  allSpecifications: any[];
  selectedSpecifications: string[];
  paymentTerms: PaymentTerm[];
  selectedPaymentTerms: string[];
  loading: boolean;
  termsInitialized: boolean;
  paymentTermsInitialized: boolean;
  // currentStep: 'select-lead' | 'select-products' | 'configure-products' | 'discount' | 'terms' | 'payment-terms' | null;
  isEditMode: boolean;
  editingQuotationId: string | null;
  prefillData: any | null;
}

const defaultTerms: Term[] = [
  {
    id: '1',
    text: 'All prices are subject to change without notice until order confirmation.',
  },
  {
    id: '2',
    text: 'This quotation is valid for 30 days from the date of issue.',
  },
  {
    id: '3',
    text: 'Delivery time is estimated and may vary based on product availability.',
  },
  {
    id: '4',
    text: 'Installation and setup services are available at additional cost.',
  },
  {
    id: '5',
    text: 'All products come with a standard 1-year warranty unless otherwise specified.',
  },
];

const defaultPaymentTerms: PaymentTerm[] = [
  {
    id: '1',
    description: 'Net 30',
    value: 'Payment due within 30 days of invoice date',
  },
  {
    id: '2',
    description: 'Net 15',
    value: 'Payment due within 15 days of invoice date',
  },
  {
    id: '3',
    description: '50% Upfront',
    value: '50% payment required before project start, remaining 50% upon completion',
  },
  {
    id: '4',
    description: 'Cash on Delivery',
    value: 'Full payment required upon delivery of goods/services',
  },
];

const initialState: QuotationBuilderState = {
  selectedLead: null,
  selectedProducts: [],
  discount: { type: 'percentage', value: 0 },
  terms: defaultTerms,
  selectedTerms: defaultTerms.map(t => t.id),
  paymentTerms: defaultPaymentTerms,
  selectedPaymentTerms: defaultPaymentTerms.map(p => p.id),
  loading: false,
  termsInitialized: false,
  paymentTermsInitialized: false,
  allSpecifications: [],
  selectedSpecifications: [],
  // currentStep: null,
  isEditMode: false,
  editingQuotationId: null,
  prefillData: null,
};

// Async thunks for terms
export const loadAllTerms = createAsyncThunk(
  "quotationBuilder/loadAllTerms",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const data = await fetchTerms(token);
      return data.data || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addCustomTerm = createAsyncThunk(
  "quotationBuilder/addCustomTerm",
  async (termText: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");

      const newTerm = await createTerm({ text: termText }, token);
      return newTerm;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteOneTerm = createAsyncThunk(
  "quotationBuilder/deleteOneTerm",
  async (termId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");

      await deleteTerm(termId, token);
      return termId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Async thunks for payment terms
export const loadAllPaymentTerms = createAsyncThunk(
  "quotationBuilder/loadAllPaymentTerms",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const data = await fetchPaymentTerms(token);
      return data.data || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addCustomPaymentTerm = createAsyncThunk(
  "quotationBuilder/addCustomPaymentTerm",
  async (paymentTermData: { description: string; value: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");

      const newPaymentTerm = await createPaymentTerm(paymentTermData, token);
      return newPaymentTerm;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteOnePaymentTerm = createAsyncThunk(
  "quotationBuilder/deleteOnePaymentTerm",
  async (paymentTermId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");

      await deletePaymentTerm(paymentTermId, token);
      return paymentTermId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// specification
export const loadAllSpecifications = createAsyncThunk(
  "quotationBuilder/loadAllSpecifications",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }
      let page = 1;

      const data = await fetchSpecifications(page, "", 50, token);

      return data?.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const quotationBuilderSlice = createSlice({
  name: 'quotationBuilder',
  initialState,
  reducers: {
    addSpecification: (state, action: PayloadAction<any>) => {
      if (!action.payload || !action.payload.id) return;

      state.allSpecifications.unshift(action.payload);
    },
    setSelectedLead: (state, action: PayloadAction<string>) => {
      state.selectedLead = action.payload;
    },
    setSelectedProducts: (state, action: PayloadAction<SelectedProduct[]>) => {
      state.selectedProducts = action.payload;
    },
    updateProductConfig: (state, action: PayloadAction<SelectedProduct[]>) => {
      state.selectedProducts = action.payload;
    },
    setDiscount: (state, action: PayloadAction<Discount>) => {
      state.discount = action.payload;
    },
    setTerms: (state, action: PayloadAction<string[]>) => {
      state.selectedTerms = action.payload;
    },
    setPaymentTerms: (state, action: PayloadAction<string[]>) => {
      state.selectedPaymentTerms = action.payload;
    },
    setSpecifications: (state, action: PayloadAction<string[]>) => {
      state.selectedSpecifications = action.payload || [];
    },
    saveQuotation: (state, action: PayloadAction<any>) => {
      // Reset builder state after saving
      state.selectedLead = null;
      state.selectedProducts = [];
      state.discount = { type: 'percentage', value: 0 };
      state.selectedTerms = [];
      state.selectedPaymentTerms = [];
    },
    resetBuilder: (state, action: PayloadAction<{ force?: boolean } | undefined>) => {
      const force = action?.payload?.force ?? false;
      if (state.isEditMode && !force) {
        state.selectedLead = null;
        state.selectedProducts = [];
        state.discount = { type: 'percentage', value: 0 };
        state.selectedTerms = state.terms.map(t => t.id);
        state.selectedPaymentTerms = state.paymentTerms.map(p => p.id);

        // state.currentStep = 'select-lead'; // Reset to first step but keep edit mode
      } else {
        // Full reset for new quotations or forced reset
        state.selectedLead = null;
        state.selectedProducts = [];
        state.discount = { type: 'percentage', value: 0 };
        state.selectedTerms = [];
        state.selectedPaymentTerms = [];
        // state.currentStep = null;
        state.isEditMode = false;
        state.editingQuotationId = null;
        state.prefillData = null;
      }
    },
    resetForNewQuotation: (state) => {
      state.selectedLead = null;
      state.selectedProducts = [];
      state.discount = { type: 'percentage', value: 0 };
      state.selectedTerms = state.terms.map(t => t.id);
      state.selectedPaymentTerms = state.paymentTerms.map(p => p.id);
      // state.currentStep = 'select-lead';
      state.isEditMode = false;
      state.editingQuotationId = null;
      state.prefillData = null;
    },
    clearTermsAndPaymentTerms: (state) => {
      state.terms = defaultTerms;
      state.paymentTerms = defaultPaymentTerms;
      state.termsInitialized = false;
      state.paymentTermsInitialized = false;
    },
    // setCurrentStep: (state, action: PayloadAction<QuotationBuilderState['currentStep']>) => {
    //   state.currentStep = action.payload;
    // },

    setEditMode: (state, action: PayloadAction<{
      isEditMode: boolean;
      quotationId?: string | null;
      prefillData?: any | null;
      // currentStep?: QuotationBuilderState['currentStep'];
    }>) => {
      state.isEditMode = action.payload.isEditMode;
      state.editingQuotationId = action.payload.quotationId || null;
      state.prefillData = action.payload.prefillData || null;
      state.selectedSpecifications = action.payload.prefillData?.specifications || [];

      const specs = action.payload.prefillData?.specifications || [];
      state.selectedSpecifications = specs.map((s: any) => String(s.id));
      // if (action.payload.currentStep) {
      //   state.currentStep = action.payload.currentStep;
      // }
    },
  },
  extraReducers: (builder) => {
    builder
      // Terms cases
      .addCase(loadAllTerms.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.terms = action.payload;
        state.termsInitialized = true;
      })
      .addCase(loadAllTerms.rejected, (state) => {
        state.loading = false;
        state.termsInitialized = false;
      })
      .addCase(addCustomTerm.fulfilled, (state, action) => {
        state.terms.unshift(action.payload);
        state.selectedTerms.push(action.payload.id);
      })
      // Payment terms cases
      .addCase(loadAllPaymentTerms.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllPaymentTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentTerms = action.payload;
        state.paymentTermsInitialized = true;
      })
      .addCase(loadAllPaymentTerms.rejected, (state) => {
        state.loading = false;
        state.paymentTermsInitialized = false;
      })
      .addCase(addCustomPaymentTerm.fulfilled, (state, action) => {
        state.paymentTerms.unshift(action.payload);
        state.selectedPaymentTerms.push(action.payload.id);
      })
      .addCase(deleteOnePaymentTerm.fulfilled, (state, action) => {
        state.paymentTerms = state.paymentTerms.filter(paymentTerm => paymentTerm.id !== action.payload);
        state.selectedPaymentTerms = state.selectedPaymentTerms.filter(id => id !== action.payload);
      })
      .addCase(deleteOnePaymentTerm.rejected, (state, action) => {
        console.error('Failed to delete payment term:', action.payload);
      })
      .addCase(deleteOneTerm.fulfilled, (state, action) => {
        state.terms = state.terms.filter(term => term.id !== action.payload);
        state.selectedTerms = state.selectedTerms.filter(id => id !== action.payload);
      })
      .addCase(deleteOneTerm.rejected, (state, action) => {
        console.error('Failed to delete term:', action.payload);
      })
      .addCase(loadAllSpecifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllSpecifications.fulfilled, (state, action) => {
        state.loading = false;
        const specs = action.payload.data || action.payload || [];
        state.allSpecifications = specs;

        // ✅ AUTO-SELECT ALL IDS
        if (state.isEditMode) {
          // ✅ Edit mode: keep whatever was prefilled (selectedSpecifications
          const preselected = state.prefillData?.specifications || [];
          const preselectedIds = preselected.map((s: any) => String(s.id));

          const validIds = specs
            .map((s: any) => String(s.id))
            .filter((id: string) => preselectedIds.includes(id));

          state.selectedSpecifications = validIds;
        } else {
          // ✅ New quotation: auto-select all by default
          state.selectedSpecifications = specs.map((s: any) => s.id);
        }
      })
      .addCase(loadAllSpecifications.rejected, (state) => {
        state.loading = false;
      })
  },
});

export const {
  setSelectedLead,
  setSelectedProducts,
  updateProductConfig,
  setDiscount,
  setTerms,
  setPaymentTerms,
  saveQuotation,
  resetBuilder,
  clearTermsAndPaymentTerms,
  // setCurrentStep,
  setEditMode,
  resetForNewQuotation,
  setSpecifications,
  addSpecification,
} = quotationBuilderSlice.actions;

export default quotationBuilderSlice.reducer;