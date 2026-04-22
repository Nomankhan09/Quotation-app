export type IFollowUpType = 'Call' | 'Email' | 'Meeting' | 'Task';
export type IFollowUpStatus = 'pending' | 'done' | 'snoozed';

export interface IFollowUpPayload {
    type: IFollowUpType;
    title: string;
    notes: string;
    date: string;
    contact_id: number;
    status?: string;
    notification_id?: string | null;
}

export interface IFollowUp {
    id: string;
    type: IFollowUpType;
    title: string;
    notes: string;
    date: string;
    due_date_raw: Date;
    status: IFollowUpStatus;
    notification_id?: string;
}

export interface IFollowUpFormValues {
    type: IFollowUpType;
    title: string;
    notes: string;
    date: string;
}