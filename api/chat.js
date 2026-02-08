export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Only POST allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // ՈՒՂՂՈՒՄ: Օգտագործում ենք v1 տարբերակը և gemini-1.5-flash մոդելը
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }]
      })
    });

    const data = await response.json();

    // Եթե API-ն վերադարձնում է սխալ
    if (data.error) {
      return res.status(200).json({ 
        text: `AI Սխալ: ${data.error.message} (Կոդ: ${data.error.code})` 
      });
    }

    // Ստուգում ենք պատասխանի առկայությունը
    if (data.candidates && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ text: aiResponse });
    } else {
      return res.status(200).json({ text: "AI-ն պատասխան չգեներացրեց, փորձեք նորից:" });
    }

  } catch (error) {
    return res.status(200).json({ text: "Սերվերային սխալ: " + error.message });
  }
}