<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
<div align="center">
# Run and deploy your AI Studio app
<h1>MediGuard: AI-Powered Hospital Compliance Auditor</h1>
  <h3>Safer Hospitals, Instant Audits. Built with Gemini 3 Pro.</h3>
  
  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-how-it-works">How It Works</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-run-locally">Run Locally</a>
  </p>
</div>

---

## 💡 Inspiration
Ensuring hospital patient safety requires strict adherence to complex Standard Operating Procedures (SOPs). However, manual auditing is slow, inconsistent, and prone to "compliance fatigue." A tired surveyor might miss a loose oxygen tank or a tripping hazard, leading to critical patient injuries.

**MediGuard** bridges the gap between written safety protocols and physical reality using **Multimodal AI**. It acts as an tireless Senior Safety Officer, visually auditing rooms against strict JCI/WHO standards in seconds.

## 🌟 Key Features

### 1. 👁️ Visual Grounding (Bounding Boxes)
Unlike standard image analysis, MediGuard doesn't just list hazards—it **points them out**.
- Uses Gemini 3 Pro's spatial reasoning to draw precise **red bounding boxes** around detected violations.
- Hover over any box to see the specific hazard details.

### 2. 🤖 AI Consultant Chat
Need to fix a violation? Ask the expert.
- Integrated **Context-Aware Chat** allows users to ask follow-up questions (e.g., *"How do I secure this oxygen tank?"*).
- The AI provides remedial actions based on the specific audit findings and medical standards.

### 3. 📋 Smart SOP Presets
Ready for any hospital environment.
- Pre-loaded with industry-standard protocols:
  - **General Ward Safety** (Fall prevention, hygiene)
  - **ICU Infection Control** (Sterile fields, PPE)
  - **Emergency Room (ER)** (Triage pathways, crash carts)
- **Custom Mode:** Paste any specific hospital policy text to audit against it.

### 4. 📊 Executive Reporting
- Instant **Safety Score (0-100%)** gauge.
- Generates a professional **Executive Summary** highlighting critical failures.
- Exportable PDF reports for hospital administration.

## ⚙️ How It Works
1. **Select Standard:** Choose an SOP preset (e.g., ICU) or paste your own.
2. **Capture Reality:** Upload a photo of the hospital room (or use the camera on mobile).
3. **AI Reasoning:** Gemini 3 Pro analyzes the image *strictly* against the text rules.
4. **Visual Audit:** View the Safety Score, read the summary, and inspect the bounding boxes on the image.
5. **Consult:** Chat with the AI to get advice on fixing the hazards.

## 🛠️ Tech Stack
- **AI Model:** Google Gemini 3 Pro (Multimodal & Reasoning)
- **Platform:** Google AI Studio
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Visualization:** Recharts (Data), Lucide React (Icons)
- **PDF Generation:** jsPDF + html2canvas
This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1bu4UOj1kBLKFudK6mgtB5h6mbsMd205V

## Run Locally

This project was built using **Vibe Coding** in Google AI Studio. To run it on your machine:

**Prerequisites:** Node.js (v18+)

1. **Clone the repository:**
   `git clone [https://github.com/nicolasadven/MediGuard.git](https://github.com/nicolasadven/MediGuard.git)`
   
   `cd MediGuard`

3. Install dependencies:
   `npm install`
4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

<div align="center"> <p>Built for the <strong>Google DeepMind: Vibe Code with Gemini 3 Pro</strong> Hackathon</p> </div>
