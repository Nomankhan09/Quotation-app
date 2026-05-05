import api from "./api";

export const fetchCallLogs = async (
    filters: {
        type?: string;
        lead_id?: number;
        from?: string;
        to?: string;
    },
    token: string
) => {
    const response = await api.get("/call-log", {
        params: filters,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data; // direct array
};

export const createCallLog = async (
    data: {
        duration: number;
        type: "INCOMING" | "OUTGOING" | "MISSED";
        lead_id: number;
        timestamp: string;
    },
    token: string
) => {
    const response = await api.post("/call-log", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const deleteCallLog = async (id: number, token: string) => {
    const response = await api.delete(`/call-log/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};