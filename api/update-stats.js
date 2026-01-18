import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { amount } = req.body;

  // Վերցնում ենք ընթացիկ գումարը
  const { data: currentData } = await supabase.from('launchpad_stats').select('total_collected').single();
  
  // Ավելացնում ենք նոր վճարված գումարը հին թվին
  const newTotal = currentData.total_collected + Number(amount);

  const { error } = await supabase
    .from('launchpad_stats')
    .update({ total_collected: newTotal })
    .eq('id', 1); // Համոզվիր, որ Supabase-ում ID-ն 1 է

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true, newTotal });
}