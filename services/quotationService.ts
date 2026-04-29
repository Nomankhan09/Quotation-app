import api from "./api";

export const createQuotation = async (quotationData: any, token: string) => {
  const response = await api.post("/quotations", quotationData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateQuotation = async (id: number, quotationData: any, token: string) => {
  const response = await api.put(`/quotations/${id}`, quotationData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchQuotations = async (token: string, page: number = 1, search: string = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: '5',
    ...(search && { search })
  });


  const response = await api.get(`/quotations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchQuotationById = async (id: number, token: string) => {
  const response = await api.get(`/quotations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchQuotationPerLead = async (token: string) => {
  const response = await api.get(`/quotations/stage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateQuotationStage = async (
  id: number,
  stage: string,
  token: string
) => {
  const response = await api.patch(
    `/quotations/stage/${id}`,
    { stage },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};

export const fetchQuotationsApi = async (
  token: string,
  page: number = 1,
  search: string = ''
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: '5',
    ...(search && { search }),
  });

  const response = await api.get(`/quotations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};
