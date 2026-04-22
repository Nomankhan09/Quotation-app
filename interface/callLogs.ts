export interface ICallLog {
    id: string;
    dateTime: string;
    duration: number;
    type: 'INCOMING' | 'OUTGOING' | 'MISSED';
    phoneNumber: string;
    name?: string;
    timestamp: string;
}