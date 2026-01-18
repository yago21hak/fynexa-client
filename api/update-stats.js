import { createClient } from '@supabase/supabase-js';
import * as solanaWeb3 from '@solana/web3.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { signature } = req.body;
    if (!signature) return res.status(400).json({ error: "No signature" });

    try {
        let txDetails = null;
        // Փորձում ենք 3 անգամ, քանի որ Devnet-ը դանդաղ է
        for (let i = 0; i < 3; i++) {
            txDetails = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
            });
            if (txDetails) break;
            await new Promise(r => setTimeout(r, 2000)); 
        }

        if (!txDetails) return res.status(400).json({ error: "Transaction not found" });

        // Վերցնում ենք ընթացիկ տվյալները բազայից
        const { data: stats, error: fetchError } = await supabase
            .from('launchpad_stats')
            .select('*')
            .maybeSingle();

        if (fetchError || !stats) throw new Error("Database fetch error");

        // Թեստի համար ավելացնում ենք 150 (կամ հաշվիր txDetails-ից)
        const amountPaid = 150; 
        const newTotal = (stats.total_collected || 0) + amountPaid;

        // Թարմացնում ենք ըստ բազայի իրական ID-ի
        const { error: updateError } = await supabase
            .from('launchpad_stats')
            .update({ total_collected: newTotal })
            .eq('id', stats.id);

        if (updateError) throw updateError;

        res.status(200).json({ success: true, newTotal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}