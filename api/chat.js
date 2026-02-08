import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Method not allowed" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Օգտագործիր "gemini-1.5-flash", այն հիմա ամենաարագն է
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { message } = req.body;
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text: text });
  } catch (error) {
    console.error("Gemini Error:", error);
    // Շատ կարևոր է վերադարձնել JSON, որպեսզի Frontend-ը չփչանա
    return res.status(200).json({ text: "AI-ն ժամանակավորապես զբաղված է: Խնդրում եմ փորձեք մի փոքր ուշ:" });
  }
}