import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Ստուգում ենք CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // 2. Ստուգում ենք Environment Variables-ի առկայությունը
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(200).json({ 
        debug: "Environment variables are missing!",
        url: !!process.env.SUPABASE_URL,
        key: !!process.env.SUPABASE_KEY
      });
    }

    // 3. Փորձում ենք միանալ Supabase-ին
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const { data, error } = await supabase
      .from('launchpad_stats')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(200).json({ debug: "Supabase Query Error", details: error });
    }

    return res.status(200).json(data);
  } catch (err) {
    // 4. Եթե ամեն ինչ ձախողվի, ուղարկիր սխալի տեքստը բրաուզերին
    return res.status(200).json({ 
      debug: "Critical Runtime Error", 
      message: err.message,
      stack: err.stack 
    });
  }
}