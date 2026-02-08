import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

// ... նախորդ կոդը ...
try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Օգտագործում ենք gemini-pro, որն ամենակայունն է այս պահին
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 

    const { message } = req.body;
    const result = await model.generateContent(message);
    const response = await result.response;
    
    return res.status(200).json({ text: response.text() });
} catch (error) {
    // ... սխալի մշակում ...
}
}