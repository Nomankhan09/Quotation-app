import api from "./api";
import { INotePayload } from "@/interface/notes";

export const fetchLeadNotes = async (token: string) => {
    const response = await api.get("/notes", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const createLeadNote = async (noteData: INotePayload, token: string) => {
    const response = await api.post("/notes", noteData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateLeadNote = async (noteId: string, noteData: INotePayload, token: string) => {
    const response = await api.put(`/notes/${noteId}`, noteData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchNotesByLead = async (token: string, leadId: number) => {
    const response = await api.get(`/notes/lead/${leadId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const deleteNoteById = async (token: string, id: number) => {
    const response = await api.delete(`/notes/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}; 