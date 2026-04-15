import api from "./api";

export const fetchLeads = async (page = 1, search = "", limit = 5, token: string) => {

  const response = await api.get("/leads", {
    params: { page, search, limit },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createLead = async (leadData: {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    notes?: string;
    location: string;
  }, token: string) => {
    const response = await api.post("/leads", leadData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteLead = async (leadId: string, token: string) => {
  const response = await api.delete(`/leads/${leadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
