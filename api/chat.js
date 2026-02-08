import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Թույլատրում ենք միայն POST հարցումները
  if (req.method !== 'POST') {
    return res.status(405).json({ text: "Միայն POST հարցումներն են թույլատրված:" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Ստուգում ենք API բանալու առկայությունը
  if (!apiKey) {
    return res.status(500).json({ text: "Սխալ: GEMINI_API_KEY-ը գտնված չէ Vercel-ի կարգավորումներում:" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Օգտագործում ենք gemini-1.5-flash-8b մոդելը (այն ավելի կայուն է անվճար պլանի համար)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      // Անվտանգության ֆիլտրերը թուլացնում ենք, որպեսզի պատասխանը չարգելափակվի
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

    // Ուղարկում ենք հարցումը Gemini-ին
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Վերադարձնում ենք հաջողված պատասխանը
    return res.status(200).json({ text: text });

  } catch (error) {
    console.error("Gemini API Error:", error);

    // Եթե սխալը կապված է տարածաշրջանի հետ (Region not supported)
    if (error.message.includes("location") || error.message.includes("supported")) {
      return res.status(200).json({ 
        text: "Սխալ: Քո Vercel սերվերի տարածաշրջանը չի աջակցվում: Խնդրում եմ Vercel Settings-ում Function Region-ը դնել 'Washington, D.C. (iad1)':" 
      });
    }

    // Ընդհանուր սխալի պատասխան JSON ֆորմատով
    return res.status(200).json({ 
      text: "AI-ն ժամանակավորապես անհասանելի է: Սխալի տեսակը՝ " + error.message 
    });
  }
}