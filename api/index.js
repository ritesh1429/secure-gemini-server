import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // 1. Enable CORS (So your CLI can talk to this server)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle browser pre-checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;

    // 2. Get the API Key from Vercel's Secret Vault
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getModel({ model: "gemini-2.0-flash" });

    // 3. The Instruction to Gemini (Force JSON output)
    const systemInstruction = `
    You are a code generator. 
    Based on the user's prompt, generate the full folder structure and code.
    Return ONLY a valid JSON array.
    Format:
    [
      { "filename": "index.html", "code": "<html>...</html>" },
      { "filename": "style.css", "code": "body { ... }" }
    ]
    Do not add markdown formatting like \`\`\`json.
    `;

    // 4. Generate Content
    const result = await model.generateContent(systemInstruction + `\nUser Prompt: "${prompt}"`);
    let responseText = result.response.text();

    // 5. Clean up the response (Remove markdown if Gemini adds it)
    responseText = responseText.replace(/```json|```/g, "").trim();

    // 6. Send the JSON list back to the CLI
    const files = JSON.parse(responseText);
    return res.status(200).json({ files: files });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}