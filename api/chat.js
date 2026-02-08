import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ text: "Միայն POST հարցումներն են թույլատրված:" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ text: "Սխալ: GEMINI_API_KEY-ը գտնված չէ Vercel-ի կարգավորումներում:" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ՈՒՂՂՈՒՄ. Մոդելը և safetySettings-ը պետք է լինեն մեկ օբյեկտի մեջ
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    });

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ text: "Հաղորդագրությունը դատարկ է:" });
    }

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text: text });

  } catch (error) {
    console.error("Gemini API Error:", error);

    if (error.message.includes("location") || error.message.includes("supported")) {
      return res.status(200).json({ 
        text: "Սխալ: Քո Vercel սերվերի տարածաշրջանը չի աջակցվում: Համոզվիր, որ Function Region-ը 'Washington, D.C. (iad1)' է և արել ես Redeploy:" 
      });
    }

    return res.status(200).json({ 
      text: "AI-ն ժամանակավորապես անհասանելի է: " + error.message 
    });
  }
}