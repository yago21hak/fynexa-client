export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // Փորձում ենք օգտագործել այս հասցեն, որը սովորաբար ավելի հուսալի է
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Google API Error:', data.error);
      return res.status(200).json({ text: `AI-ն ժամանակավորապես անհասանելի է: (${data.error.message})` });
    }

    if (data.candidates && data.candidates[0].content) {
      return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    }

    return res.status(200).json({ text: "AI-ն պատասխան չունի:" });
  } catch (error) {
    return res.status(200).json({ text: "Սխալ: " + error.message });
  }
}