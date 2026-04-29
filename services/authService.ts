import api from "./api";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name?: string;
    company_address?: string;
    zip_code?: string;
    company_phone?: string;
    website?: string;
    company_logo?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CompanyInfoRequest {
  company_name: string;
  company_address?: string;
  zip_code?: string;
  company_phone?: string;
  website?: string;
  company_logo?: string;
  pdf_file_name_format?: string
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/login", { email, password });
  return response.data;
};

export const updateCompanyInfo = async (companyData: CompanyInfoRequest, token: string) => {
  const response = await api.put("/user/company-info", companyData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};