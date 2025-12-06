
import { AuditResult, SavedAudit, PendingAudit } from "../types";

const STORAGE_KEY = 'mediguard_audit_history';
const PENDING_QUEUE_KEY = 'mediguard_pending_queue';

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Resolve with the full Data URL (e.g. "data:image/png;base64,...")
      // The Gemini Service will strip the prefix if needed, or we handle it there
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- History Storage ---

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

// --- Offline Queue Storage ---

export const savePendingAudit = async (imageFile: File, sopText: string, sessionName: string, sopFile?: File): Promise<void> => {
  try {
    const imageBase64 = await fileToBase64(imageFile);
    let sopFileBase64: string | undefined = undefined;
    
    if (sopFile) {
      sopFileBase64 = await fileToBase64(sopFile);
    }

    const pendingItem: PendingAudit = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sessionName: sessionName.trim() || `Offline Audit - ${new Date().toLocaleString()}`,
      sopText: sopText,
      imageBase64: imageBase64,
      sopFileBase64: sopFileBase64
    };

    const queue = getPendingAudits();
    queue.push(pendingItem);
    
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save pending audit. LocalStorage might be full.", error);
    throw new Error("Failed to save to device. Storage might be full.");
  }
};

export const getPendingAudits = (): PendingAudit[] => {
  try {
    const stored = localStorage.getItem(PENDING_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse pending queue", error);
    return [];
  }
};

export const removePendingAudit = (id: string): PendingAudit[] => {
  const queue = getPendingAudits();
  const updatedQueue = queue.filter(item => item.id !== id);
  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(updatedQueue));
  return updatedQueue;
};