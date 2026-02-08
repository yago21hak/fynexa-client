import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Սա «System Prompt»-ն է, որտեղ բոտին բացատրում ենք՝ ով է ինքը
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Դու Fynexa Launchpad-ի օգնականն ես։ Պատասխանիր հայերեն։ Մեր թոքենը FYX-ն է, արժեքը 15 USDC է։ Վաճառքը Solana-ով է։" }],
        },
        {
          role: "model",
          parts: [{ text: "Հասկացա։ Ես պատրաստ եմ օգնել Fynexa-ի օգտատերերին։" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    res.status(200).json({ text: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}