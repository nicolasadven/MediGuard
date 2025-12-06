
import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AuditResult, Language } from "../types";

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix to get raw base64 (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const auditResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    complianceScore: {
      type: Type.INTEGER,
      description: "A score from 0 to 100 indicating the level of compliance with the SOP.",
    },
    compliantItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of items or conditions in the image that adhere to the SOP.",
    },
    violations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hazard: { type: Type.STRING, description: "Description of the violation or hazard." },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Severity level of the violation." },
          remedialAction: { type: Type.STRING, description: "Specific action to correct the violation." },
          boundingBox: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Bounding box of the hazard [ymin, xmin, ymax, xmax] on a 1000x1000 scale.",
          },
        },
        required: ["hazard", "severity", "remedialAction", "boundingBox"],
      },
      description: "List of violations found based on the SOP and general hospital safety standards, including their locations in the image.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief executive summary of the audit findings.",
    },
  },
  required: ["complianceScore", "compliantItems", "violations", "summary"],
};

// Modified to accept File OR string (base64) for imageSource
export const analyzeCompliance = async (
  sopText: string, 
  imageSource: File | string, 
  sopFile?: File | string, // Can be File or base64 string
  language: Language = 'en'
): Promise<AuditResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Handle Image Source
    let imageBase64 = "";
    let imageMimeType = "image/jpeg"; // Default fallback

    if (imageSource instanceof File) {
      imageBase64 = await fileToBase64(imageSource);
      imageMimeType = imageSource.type;
    } else {
      // Assume input is a Data URL or Raw Base64
      if (imageSource.includes(',')) {
        imageMimeType = imageSource.split(';')[0].split(':')[1];
        imageBase64 = imageSource.split(',')[1];
      } else {
        imageBase64 = imageSource;
      }
    }

    const parts: any[] = [];
    let promptText = `
      Act as a Senior JCI Hospital Accreditation Auditor. 
      Analyze the uploaded image STRICTLY based on the provided Standard Operating Procedures (SOP). 
      Identify every visible hazard and detect its location in the image.
      If a rule is violated, explain exactly why based on visual evidence. 
      All outputs must be in professional English.

      ADDITIONAL INSTRUCTIONS:
      1. Identify general safety hazards even if not explicitly in the SOP.
      2. List compliant items you clearly see.
      3. Assign a compliance score (0-100).
      4. For every violation found, you MUST provide a bounding box [ymin, xmin, ymax, xmax] localized to the specific hazard in the image.

      OUTPUT INSTRUCTION: 
      The entire JSON response (summary, hazards, remedial actions) MUST be written in ${language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'}. 
      The technical terms can remain in English if necessary, but the explanation must be in the target language.
    `;

    // Handle SOP Source (File vs Text)
    if (sopFile) {
      let sopBase64 = "";
      if (sopFile instanceof File) {
        sopBase64 = await fileToBase64(sopFile);
      } else {
        // Assume string input for pending queue sync
         if (sopFile.includes(',')) {
          sopBase64 = sopFile.split(',')[1];
        } else {
          sopBase64 = sopFile;
        }
      }
      
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: sopBase64
        }
      });
      promptText += "\n\nRefer to the attached PDF document for the Standard Operating Procedures.";
    } else {
      promptText += `\n\nSOP TEXT:\n"${sopText}"`;
    }

    // Add Prompt
    parts.push({ text: promptText });

    // Add Image
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: auditResponseSchema,
        temperature: 0.2, 
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("The analysis could not be completed. The AI model returned an empty response, possibly due to safety content filters.");
    }

    try {
      return JSON.parse(resultText) as AuditResult;
    } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("Received an invalid response format from the AI model.");
    }

  } catch (error: any) {
    console.error("Audit Analysis Error:", error);
    
    let detailedMessage = error.message || "An unknown error occurred during the audit.";
    const errorString = detailedMessage.toLowerCase();

    if (detailedMessage.includes("403") || errorString.includes("permission denied")) {
      detailedMessage = "Access Denied (403): The API key provided is invalid or does not have access to this model.";
    } else if (detailedMessage.includes("404") || errorString.includes("not found")) {
      detailedMessage = "Model Not Found (404): The specified AI model version might be deprecated or unavailable.";
    } else if (detailedMessage.includes("429") || errorString.includes("quota")) {
      detailedMessage = "Rate Limit Exceeded (429): API quota exhausted. Please try again in a few minutes.";
    } else if (detailedMessage.includes("500")) {
      detailedMessage = "Server Error (500): The Gemini API encountered an internal error. Please try again later.";
    } else if (detailedMessage.includes("503") || errorString.includes("overloaded")) {
      detailedMessage = "Service Unavailable (503): The AI service is currently overloaded. Please try again shortly.";
    } else if (errorString.includes("candidate") || errorString.includes("safety")) {
      detailedMessage = "Safety Violation: The AI model refused to process the image/document due to safety guidelines.";
    } else if (errorString.includes("fetch failed") || errorString.includes("network")) {
      detailedMessage = "Network Error: Could not connect to the AI service. Please check your internet connection.";
    }

    throw new Error(detailedMessage);
  }
};

/**
 * Creates a chat session context-aware of the audit results
 */
export const createConsultantChat = (auditResult: AuditResult, language: Language = 'en'): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a Senior JCI Hospital Accreditation Consultant.
    
    CONTEXT:
    You have just performed an audit on a hospital room.
    The specific findings are:
    ${JSON.stringify(auditResult)}
    
    YOUR GOAL:
    Answer the user's questions about these findings.
    If they ask how to fix a specific violation listed in the findings, provide detailed, expert medical and safety advice based on JCI standards and the specific remedial action listed in the report.
    If they ask about general safety, answer as an expert.
    
    OUTPUT REQUIREMENT:
    You must reply to the user in ${language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'}.

    TONE:
    Professional, helpful, strict on safety, but constructive.
    Keep answers concise and actionable (under 150 words usually).
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const sendConsultantMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage({ message });
    return result.text || "I apologize, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error("Failed to send message to consultant.");
  }
};