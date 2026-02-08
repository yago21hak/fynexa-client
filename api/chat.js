export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Only POST allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // Սա մեզ կօգնի տեսնել իրական ռեգիոնը Vercel Logs-ում
  const currentRegion = process.env.VERCEL_REGION || "unknown";
  console.log("Current execution region:", currentRegion);

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
      // Եթե Google-ը ասում է, որ location-ը չի աջակցվում
      if (data.error.message.toLowerCase().includes("location")) {
        return res.status(200).json({ 
          text: `Google-ը մերժում է հարցումը: Սերվերը դեռ գտնվում է ${currentRegion} ռեգիոնում: Խնդրում եմ արա Redeploy 'Clear Build Cache'-ով:` 
        });
      }
      throw new Error(data.error.message);
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: aiResponse });

  } catch (error) {
    return res.status(200).json({ text: "Սխալ: " + error.message });
  }
}