import api from "./api";

export const fetchSpecifications = async (page = 1, search = "", limit = 5, token: string) => {
    const response = await api.get("/specifications", {
        params: { page, search, limit },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const createSpecification = async (specificationData: {
    item: string;
    description: { description: string }[];
}, token: string) => {
    const response = await api.post("/specifications", specificationData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
};

export const deleteSpecification = async (specificationId: string, token: string) => {
    const response = await api.delete(`/specifications/${specificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateSpecification = async (specificationId: string, specificationData: {
    item?: string;
    description?: { description: string }[];
}, token: string) => {
    const response = await api.put(`/specifications/${specificationId}`, specificationData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}