
import { AuditResult, SavedAudit } from "../types";

const STORAGE_KEY = 'mediguard_audit_history';

export const saveAudit = (result: AuditResult, sopText: string, sessionName: string): SavedAudit => {
  const audits = getAudits();
  
  const newAudit: SavedAudit = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionName: sessionName.trim() || `Audit - ${new Date().toLocaleString()}`,
    sopPreview: sopText.slice(0, 150) + (sopText.length > 150 ? '...' : ''),
    fullSOP: sopText,
    complianceScore: result.complianceScore,
    result: result
  };

  // Add to beginning of array
  const updatedAudits = [newAudit, ...audits];
  
  // Limit to last 50 items to prevent storage overflow
  if (updatedAudits.length > 50) {
    updatedAudits.length = 50;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudits));
  return newAudit;
};

export const getAudits = (): SavedAudit[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse audit history", error);
    return [];
  }
};

export const deleteAudit = (id: string): SavedAudit[] => {
  const audits = getAudits();
  const updatedAudits = audits.filter(audit => audit.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudits));
  return updatedAudits;
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
