import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
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
    
    // 👇👇 YAHAN CHANGE KIYA HAI 👇👇
    //const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const systemInstruction = `
    Generate a project file structure based on the prompt.
    Return ONLY a JSON array: [{"filename": "...", "code": "..."}].
    No markdown.
    `;

    const result = await model.generateContent(systemInstruction + `\nPrompt: "${prompt}"`);
    let text = result.response.text();
    text = text.replace(/```json|```/g, "").trim();
    
    const files = JSON.parse(text);
    return res.status(200).json({ files: files });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}