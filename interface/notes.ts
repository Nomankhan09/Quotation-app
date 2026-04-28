// ─── Note Interface ───────────────────────────────────────────────────────────
export interface INote {
    id: number | string;
    lead_id: number;
    user_id: number;
    note: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
    };
}

// ─── Note Payload (for create / update) ──────────────────────────────────────

export interface INotePayload {
    lead_id: number;
    note: string;
}