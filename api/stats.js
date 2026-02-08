import { createClient } from '@supabase/supabase-js';

// Ստեղծում ենք client-ը ֆունկցիայից դուրս՝ արագության համար
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false // Սա օգնում է խուսափել ավելորդ fetch-երից
    }
  }
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { data, error } = await supabase
      .from('launchpad_stats')
      .select('*')
      .single();

    if (error) {
      console.error('Supabase Query Error:', error);
      return res.status(500).json({ error: error.message, details: error.details });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Runtime Error:', err);
    return res.status(500).json({ 
      error: "Connection failed", 
      message: err.message,
      hint: "Check if Supabase project is active or paused" 
    });
  }
}