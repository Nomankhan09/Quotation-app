import api from "./api";

export const fetchTerms = async (token: string, search = "") => {
  const response = await api.get("/terms", {
    params: { search },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createTerm = async (termData: {
  text: string;
}, token: string) => {
  const response = await api.post("/terms", termData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteTerm = async (termId: number, token: string) => {
  const response = await api.delete(`/terms/${termId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};