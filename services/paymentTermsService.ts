import api from "./api";

export const fetchPaymentTerms = async (token: string, search = "") => {
  const response = await api.get("/payment-terms", {
    params: { search },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createPaymentTerm = async (paymentTermData: {
  description: string;
  value: string;
}, token: string) => {
  const response = await api.post("/payment-terms", paymentTermData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deletePaymentTerm = async (paymentTermId: number, token: string) => {
  const response = await api.delete(`/payment-terms/${paymentTermId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};