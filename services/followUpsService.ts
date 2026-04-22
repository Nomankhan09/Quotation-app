import { IFollowUpPayload } from "@/interface/followUp";
import api from "./api";

export const fetchFollowUps = async (token: string) => {
    const response = await api.get("/follow-ups", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const createFollowUp = async (followUpdData: IFollowUpPayload, token: string) => {
    const response = await api.post("/follow-ups", followUpdData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteFollowUp = async (followUpId: string, token: string) => {
    const response = await api.delete(`/follow-ups/${followUpId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateFollowUp = async (followUpId: string, leadData: IFollowUpPayload, token: string) => {
    const response = await api.put(`/follow-ups/${followUpId}`, leadData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchFollowUpsByLead = async (token: string, leadId: number) => {
    const response = await api.get(`/follow-ups/lead/${leadId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};