import api from "./api";

export const fetchProducts = async (page = 1, search = "", limit = 5, token: string) => {
  const response = await api.get("/products", {
    params: { page, search, limit },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createProduct = async (productData: {
    category_id: number;
    product_name: string;
    unit_price: number;
    description?: string;
  }, token: string) => {
    const response = await api.post("/products", productData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteProduct = async (productId: string, token: string) => {
  const response = await api.delete(`/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};