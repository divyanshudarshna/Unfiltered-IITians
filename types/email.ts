// Type definitions for email service

export type EmailTemplate = 
  | 'welcome'
  | 'course_purchase'
  | 'mock_purchase'
  | 'guidance_session'
  | 'subscription'
  | 'custom';

export interface EmailData {
  userName?: string;
  courseName?: string;
  mockName?: string;
  sessionDate?: string;
  sessionTime?: string;
  purchaseAmount?: string;
  additionalInfo?: string;
}

export interface SendEmailParams {
  to: string;
  template?: EmailTemplate;
  data?: EmailData;
  customSubject?: string;
  customHtml?: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

export interface EmailApiRequest {
  to: string;
  template?: EmailTemplate;
  data?: EmailData;
  customSubject?: string;
  customHtml?: string;
}
