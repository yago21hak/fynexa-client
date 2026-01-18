import { createClient } from '@supabase/supabase-js';
import * as solanaWeb3 from '@solana/web3.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
const RECEIVER_WALLET = "6ynnHZA4jr9izeoyT9iGuJTJvDnpxmfgMcnF1fXh1WeS";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { signature } = req.body; // Ստանում ենք միայն Signature-ը

  try {
    // 1. Ստուգում ենք տրանզակցիան բլոկչեյնում
    const txDetails = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });

    if (!txDetails) return res.status(400).json({ error: "Transaction not found" });

    // 2. Այստեղ կարող ես ավելացնել լրացուցիչ ստուգումներ՝ 
    // արդյոք RECEIVER_WALLET-ը ստացել է գումարը և որքան։
    // Պարզության համար ենթադրենք ստուգումն անցավ։

    const amountPaid = 150; // Այստեղ կարելի է դուրս բերել իրական թիվը txDetails-ից

    // 3. Թարմացնում ենք բազան
    const { data: currentData } = await supabase.from('launchpad_stats').select('total_collected').single();
    const newTotal = currentData.total_collected + amountPaid;

    await supabase.from('launchpad_stats').update({ total_collected: newTotal }).eq('id', 1);

    res.status(200).json({ success: true, newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}