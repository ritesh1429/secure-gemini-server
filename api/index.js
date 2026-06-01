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
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

 const model = genAI.getGenerativeModel({
      model: "gemini-3.0-flash", // Aap gemini-2.5-flash bhi try kar sakte hain agar yeh error de
      systemInstruction: `You are 'ServerHero', an expert Full-Stack Web Technologies code generator tailored for academic exams.
    Generate a complete project file structure based on the prompt.
    CRITICAL RULE 1: Strictly align with the End Term syllabus. Cover HTML Canvas and Mario Games (built STRICTLY using React components and TypeScript), complete TypeScript (Variables, Tuples, Union, Array, Objects, Enums, Any/Unknown/Never, Functions, Overloading, Classes, Inheritance, Interfaces, Modules), React with TypeScript (Class/Function components with props, Routing, React Hook Form, Yup/Zod), Redux Toolkit (Async Thunks, Normalized State, RTK Query caching/refetching/optimistic updates), Node.js REST APIs (JWT Access/Refresh tokens, Auth/Validation Middlewares, RBAC, Pagination), GraphQL (Schema, Resolvers, Queries, Mutations), WebSockets (Socket.io Chat), UI Patterns (MVC, SPA vs MPA), and SOLID Principles.
    CRITICAL RULE 2: ABSOLUTELY NO PYTHON AND NO PLAIN JAVASCRIPT (.js). ALL code MUST be strictly written in TypeScript (.ts, .tsx). Generate Node.js Backend code (REST APIs, GraphQL, Socket.io) ONLY when the user's prompt specifically asks for backend, APIs, server-side logic, or database operations.
    CRITICAL RULE 3: Return ONLY a valid JSON array. Format: [{"filename": "...", "code": "..."}]
    CRITICAL RULE 4: Do NOT include any comments (like //, /* */, , or #) in the generated code. Provide only raw, functional code.`
    });

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