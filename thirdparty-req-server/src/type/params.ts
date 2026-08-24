export type Params = {
    action: string;
    apikey: string;
    deviceid: string;
    params: Record<string, any>;
    d_seq?: number;
    userAgent?: string;
}