import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditResult } from "../types";

const processImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix to get raw base64
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
        },
        required: ["hazard", "severity", "remedialAction"],
      },
      description: "List of violations found based on the SOP and general hospital safety standards.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief executive summary of the audit findings.",
    },
  },
  required: ["complianceScore", "compliantItems", "violations", "summary"],
};

export const analyzeCompliance = async (sopText: string, imageFile: File): Promise<AuditResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imageBase64 = await processImage(imageFile);

    const prompt = `
      Act as a Senior JCI Hospital Accreditation Auditor. 
      Analyze the uploaded image STRICTLY based on the provided text (SOP). 
      Identify every visible hazard. 
      If a rule is violated, explain exactly why based on visual evidence. 
      All outputs must be in professional English.
      
      SOP TEXT:
      "${sopText}"

      ADDITIONAL INSTRUCTIONS:
      1. Identify general safety hazards even if not explicitly in the SOP.
      2. List compliant items you clearly see.
      3. Assign a compliance score (0-100).
      4. For every violation, provide a severity level and a specific remedial action.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageFile.type,
              data: imageBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: auditResponseSchema,
        temperature: 0.2, // Low temperature for more analytical/factual output
      },
    });

    const resultText = response.text;
    
    // Check if the model refused to generate content (e.g. safety blocks)
    if (!resultText) {
      throw new Error("The analysis could not be completed. The AI model returned an empty response, possibly due to safety content filters blocking the image or prompt.");
    }

    try {
      return JSON.parse(resultText) as AuditResult;
    } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("Received an invalid response format from the AI model. Please try again.");
    }

  } catch (error: any) {
    console.error("Audit Analysis Error:", error);
    
    let detailedMessage = error.message || "An unknown error occurred during the audit.";
    const errorString = detailedMessage.toLowerCase();

    // Enhance common HTTP errors with friendlier messages
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
      detailedMessage = "Safety Violation: The AI model refused to process the image due to safety guidelines. Please try a different image.";
    } else if (errorString.includes("fetch failed") || errorString.includes("network")) {
      detailedMessage = "Network Error: Could not connect to the AI service. Please check your internet connection.";
    }

    throw new Error(detailedMessage);
  }
};