
export type Language = 'en' | 'id';

export interface Violation {
  hazard: string;
  severity: 'High' | 'Medium' | 'Low';
  remedialAction: string;
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax] coordinates (0-1000)
}

export interface AuditResult {
  complianceScore: number;
  compliantItems: string[];
  violations: Violation[];
  summary: string;
}

export interface SavedAudit {
  id: string;
  timestamp: number;
  sessionName?: string;
  sopPreview: string;
  fullSOP: string;
  complianceScore: number;
  result: AuditResult;
}

export interface PendingAudit {
  id: string;
  timestamp: number;
  sessionName: string;
  sopText: string;
  imageBase64: string; // Stored as base64 since File objects don't persist in localStorage
  sopFileBase64?: string; // Optional PDF base64
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export type LoadingState = 'idle' | 'analyzing' | 'complete' | 'error';