import { sendErrorToServer } from "@/app/ErrorReporter";
import axios from "axios";

// export const API_URL = "http://192.168.1.7:8000/api";
export const API_URL = "https://crmapp.flairm.com/quotepro/public/api";

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    sendErrorToServer({
      message: error?.message,
      stack: error?.response,
      type: "API_ERROR",
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
      created_at: new Date().toISOString(),
    });

    return Promise.reject(error);
  }
);

export default api;
