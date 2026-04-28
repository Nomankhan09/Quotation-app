import api from "./api";

export const fetchLeadActivity = async (token: string, leadId: number) => {
    const response = await api.get(`/activity/logs`, {
        params: { lead_id: leadId },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};