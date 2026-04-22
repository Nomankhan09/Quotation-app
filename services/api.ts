import axios from "axios";

const API_URL = "http://192.168.1.6:8000/api";
// const API_URL = "https://crmapp.flairm.com/quotepro/public/api";

const api = axios.create({
  baseURL: API_URL,
  
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
