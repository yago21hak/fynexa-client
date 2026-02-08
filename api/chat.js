export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Only POST allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // Օգտագործում ենք gemini-1.5-flash, որը հիմա ամենահասանելին է
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        text: `Google API-ն մերժեց հարցումը: ${data.error.message}. (Սխալի կոդ: ${data.error.code})` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    }
    
    return res.status(200).json({ text: "AI-ն այս պահին չի կարող պատասխանել:" });

  } catch (error) {
    return res.status(200).json({ text: "Կապի սխալ: " + error.message });
  }
}