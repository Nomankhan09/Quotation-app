export interface ILead {
    id: string;
    full_name: string;
    company_name?: string;
    job_title?: string;
    email?: string;
    phone: string;
    stage: string;
    location: string;
}