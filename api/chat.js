// Հիշողության մեջ պահում ենք IP-ները և վերջին հարցման ժամանակը
const ratelimit = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: "Only POST allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { message } = req.body;

  // Ստանում ենք օգտատիրոջ IP հասցեն
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  // --- Rate Limiting Տրամաբանություն ---
  if (ratelimit.has(userIp)) {
    const lastTime = ratelimit.get(userIp);
    const diff = now - lastTime;

    if (diff < 10000) { // Եթե 10 վայրկյանից քիչ է անցել
      const timeLeft = Math.ceil((10000 - diff) / 1000);
      return res.status(200).json({ 
        text: `Խնդրում ենք սպասել ${timeLeft} վայրկյան հաջորդ հարցումից առաջ: ⏳` 
      });
    }
  }
  
  // Թարմացնում ենք վերջին հարցման ժամանակը տվյալ IP-ի համար
  ratelimit.set(userIp, now);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
      return res.status(200).json({ text: `AI Սխալ: ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0].content) {
      return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    }

    return res.status(200).json({ text: "Պատասխան չստացվեց:" });
  } catch (error) {
    return res.status(200).json({ text: "Կապի սխալ: " + error.message });
  }
}