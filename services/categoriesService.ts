import api from "./api";

export const fetchCategories = async (page = 1, search = "", limit = 5, token: string) => {
  const response = await api.get("/categories", {
    params: { page, search, limit },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createCategory = async (categoryData: {
    category_name: string;
    description?: string;
    color: string;
  }, token: string) => {
    const response = await api.post("/categories", categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateCategory = async (categoryId: number,categoryData: {
    category_name: string;
    description?: string;
    color: string;
  }, token: string) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteCategory = async (categoryId: string, token: string) => {
  const response = await api.delete(`/categories/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};