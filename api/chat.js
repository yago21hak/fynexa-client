export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Only POST allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // Ուղիղ հասցե դեպի Google API v1 (ոչ թե v1beta)
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
      throw new Error(data.error.message);
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: aiResponse });

  } catch (error) {
    console.error("Direct API Error:", error.message);
    
    // Եթե ռեգիոնի սխալ է
    if (error.message.includes("location") || error.message.includes("supported")) {
        return res.status(200).json({ text: "Տարածաշրջանի սխալ: Ստուգիր Vercel Region-ը (պետք է լինի iad1):" });
    }

    return res.status(200).json({ text: "Սխալ: " + error.message });
  }
}