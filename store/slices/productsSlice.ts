import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchProducts, createProduct } from '@/services/productsService';
import { RootState } from '..';

export interface Product {
  id: string;
  product_name: string;
  description: string;
  unit_price: number;
  category_id: string;
  created_at: string;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  search: string;
  initialized: boolean;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  search: "",
  initialized: false,
};

// Load all products with pagination
export const loadAllProducts = createAsyncThunk(
  "products/loadAllProducts",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      let allProducts: Product[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchProducts(page, "", 50, token);
        allProducts = [...allProducts, ...data.data];
        hasMore = allProducts.length < data.total;
        page++;
      }

      return allProducts;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (productData: {
    category_id: number;
    product_name: string;
    unit_price: number;
    description?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("No authentication token found");
      const newProduct = await createProduct(productData, token);
      return newProduct;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProductSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearProducts: (state) => {
      state.products = [];
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.initialized = true;
      })
      .addCase(loadAllProducts.rejected, (state) => {
        state.loading = false;
        state.initialized = false;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      });
  },
});

export const { setProductSearch, clearProducts } = productsSlice.actions;
export default productsSlice.reducer;