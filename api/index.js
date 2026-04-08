import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return res.status(500).json({ error: "Server API Key missing" });

    const genAI = new GoogleGenerativeAI(apiKey);
    // 1.5 Flash sabse stable hai
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
    You are a code generator.
    Generate a project file structure based on the prompt.
    Return ONLY a valid JSON array.
    Format: [{"filename": "...", "code": "..."}]
    Do not add any conversational text before or after the JSON.
    `;

    const result = await model.generateContent(systemInstruction + `\nPrompt: "${prompt}"`);
    let text = result.response.text();

    // --- 🧹 NEW CLEANING LOGIC START ---
    
    // 1. Markdown (```json) hatayein
    text = text.replace(/```json|```/g, "").trim();

    // 2. Sirf '[' se lekar ']' tak ka hissa nikalein
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']') + 1;

    if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex);
    }
    // --- 🧹 NEW CLEANING LOGIC END ---
    
    const files = JSON.parse(text);
    return res.status(200).json({ files: files });

  } catch (error) {
    console.error("Error:", error);
    // Agar JSON parse fail ho, to error return karein
    return res.status(500).json({ error: error.message });
  }
}