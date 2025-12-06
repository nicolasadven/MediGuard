
export interface Violation {
  hazard: string;
  severity: 'High' | 'Medium' | 'Low';
  remedialAction: string;
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

export type LoadingState = 'idle' | 'analyzing' | 'complete' | 'error';
