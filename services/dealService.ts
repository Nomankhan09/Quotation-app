import { Lead } from "@/store/slices/leadsSlice";
import api from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Deal {
    id: number;
    lead_id: number;
    title: string | null;
    value: number | null;
    expected_close_date: string | null;
    assigned_to: number | null;
    description: string | null;
    stage_id: number | null;
    created_at: string;
    updated_at: string;
    stage?: {
        id: number;
        stage_name: string;
        color?: string;
    };
    quotation?: any[];
    quotation_id?: number[] | null;
    lead?: Lead;
}

export interface UpdateDealStagePayload {
    stage_id: number;
}

export interface DealStage {
    id: number;
    stage_name: string;
    probability: number;
    is_closed: number;
    is_won: number;
    color: string;
}

export interface CreateDealPayload {
    lead_id: number;
    title?: string | null;
    value?: number | null;
    expected_close_date?: string | null;
    assigned_to?: number | null;
    description?: string | null;
    stage_id?: number | null;
    quotation_id?: number[] | null;
}

export interface UpdateDealPayload extends Partial<CreateDealPayload> { }

export interface DealFilters {
    lead_id?: number;
    stage_id?: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const fetchDeals = async (
    filters: DealFilters,
    token: string
): Promise<Deal[]> => {
    const response = await api.get("/deals", {
        params: filters,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data; // direct array
};

export const fetchDealById = async (
    id: number,
    token: string
): Promise<Deal> => {
    const response = await api.get(`/deals/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const createDeal = async (
    data: CreateDealPayload,
    token: string
): Promise<{ data: Deal }> => {
    const response = await api.post("/deals", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const updateDeal = async (
    id: number,
    data: UpdateDealPayload,
    token: string
): Promise<{ data: Deal }> => {
    const response = await api.put(`/deals/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const fetchDealStages = async (
    token: string
): Promise<DealStage[]> => {
    const response = await api.get("/deal-stage", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data.data; // direct array
};

export const updateDealStage = async (
    id: number,
    data: UpdateDealStagePayload,
    token: string
): Promise<{ data: Deal }> => {
    const response = await api.patch(`/deals/stage/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};