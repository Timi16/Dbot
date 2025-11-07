/**
 * Twilio WhatsApp Type Definitions
 */
export interface TwilioWebhookPayload {
    MessageSid: string;
    AccountSid: string;
    From: string;
    To: string;
    Body: string;
    NumMedia: string;
    ProfileName?: string;
    WaId?: string;
    MediaUrl0?: string;
    MediaContentType0?: string;
    MediaUrl1?: string;
    MediaContentType1?: string;
}
export interface TwilioMessageOptions {
    to: string;
    from: string;
    body: string;
    mediaUrl?: string[];
}
export interface TwilioMessageResponse {
    sid: string;
    status: TwilioMessageStatus;
    errorCode?: number | null;
    errorMessage?: string | null;
}
export type TwilioMessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed' | 'read';
export interface SendMessageParams {
    to: string;
    message: string;
    mediaUrl?: string[];
}
export interface SendMessageResult {
    success: boolean;
    messageSid?: string;
    error?: string;
}
export interface TwilioError {
    code: number;
    message: string;
    moreInfo: string;
    status: number;
}
//# sourceMappingURL=twilio.types.d.ts.map