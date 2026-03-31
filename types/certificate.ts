// Type definitions for certificate feature

export interface CertificateData {
  id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  courseType: 'COMPETITIVE' | 'SKILLS' | 'WORKSHOP';
  completionDate: Date | string;
  issuedAt: Date | string;
  durationMonths: number;
  instructorName: string;
  instructorDesignation: string;
  companyName: string;
}

export interface CertificateTemplateProps {
  certificate: CertificateData;
  showDownloadButton?: boolean;
  showEmailButton?: boolean;
  onDownload?: () => void;
  onEmail?: () => void;
}

export interface GenerateCertificateRequest {
  courseId: string;
}

export interface GenerateCertificateResponse {
  success: boolean;
  certificate?: {
    id: string;
    certificateId: string;
    studentName: string;
    courseName: string;
    completionDate: string;
    issuedAt: string;
  };
  error?: string;
}

export interface EmailCertificateRequest {
  certificateId: string;
  courseId: string;
}

export interface EmailCertificateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CertificateEligibility {
  isEligible: boolean;
  reason?: string;
  progress: number;
  courseType: 'COMPETITIVE' | 'SKILLS' | 'WORKSHOP';
  hasCertificate: boolean;
  certificateId?: string;
}
