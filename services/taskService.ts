import api from "./api";

export interface ITaskPayload {
    contact_id?: number | null;
    title: string;
    status: 'pending' | 'completed';
    due_date?: Date | string | null;
    priority?: number | null;
    notes?: string | null;
    notification_id?: string | null;
}

export const fetchAllTasks = async (token: string) => {
    const response = await api.get('/tasks', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchTasksByLead = async (token: string, leadId: number) => {
    const response = await api.get(`/tasks/lead/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createTask = async (payload: ITaskPayload, token: string) => {
    const response = await api.post('/tasks', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateTask = async (id: string, payload: Partial<ITaskPayload>, token: string) => {
    const response = await api.put(`/tasks/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteTask = async (id: string, token: string) => {
    const response = await api.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchTodayTask = async (token: string) => {
    const response = await api.get(`/tasks/today`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchTasksStatus = async (token: string) => {
    const response = await api.get('/tasks/status', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchTasksPriority = async (token: string) => {
    const response = await api.get('/tasks/priority', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};