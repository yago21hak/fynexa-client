import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Ստանում ենք տվյալները Supabase-ից
  const { data, error } = await supabase
    .from('launchpad_stats')
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Վերադարձնում ենք տվյալները քո ֆրոնտենդին
  res.status(200).json({
    raised: data.total_collected,
    goal: 900000,
    sold: data.total_collected * 111, // Օրինակ՝ 1 USD = 111 FYX
    remaining: 100000000 - (data.total_collected * 111)
  });
}