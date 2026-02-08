import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Թույլատրել CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  // Ստուգում ենք API Key-ը
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing Gemini API Key in Vercel settings" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Դու Fynexa-ի օգնականն ես: Պատասխանիր կարճ և հայերեն: Հարց: ${message}`);
    const response = await result.response;
    
    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "AI service temporary unavailable", details: error.message });
  }
}