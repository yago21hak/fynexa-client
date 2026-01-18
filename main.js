// --- 1. ԿՈՆՖԻԳՈՒՐԱՑԻԱ ---
const RECEIVER_PUBKEY = new solanaWeb3.PublicKey("6ynnHZA4jr9izeoyT9iGuJTJvDnpxmfgMcnF1fXh1WeS");
const USDC_MINT = new solanaWeb3.PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYJJgZ97S6SE");
const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
let wallet = null;

// --- 2. ԾԱՆՈՒՑՈՒՄՆԵՐ (Մեկ ֆունկցիա բոլորի համար) ---
function notify(msg, isError = false) {
    const toast = document.getElementById('toast') || document.getElementById('status-toast');
    if (!toast) return console.log(msg);
    
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.backgroundColor = isError ? '#fee2e2' : '#dcfce7';
    toast.style.color = isError ? '#dc2626' : '#16a34a';
    toast.style.border = `1px solid ${isError ? '#dc2626' : '#16a34a'}`;
    
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

// --- 3. ԴՐԱՄԱՊԱՆԱԿԻ ՄԻԱՑՈՒՄ ---
async function connectWallet() {
    try {
        const provider = window.phantom?.solana || window.solana;
        if (!provider) return alert("Phantom wallet not found");

        const resp = await provider.connect();
        wallet = resp.publicKey;
        
        const btn = document.getElementById('connectBtn');
        btn.innerText = `Connected: ${wallet.toBase58().slice(0, 6)}...`;
        btn.style.background = "#10b981"; // Փոխում ենք գույնը կանաչի
        
        document.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
        notify("Դրամապանակը միացված է:");
        updateProgressBar();
    } catch (err) {
        console.error(err);
        notify("Միացման սխալ", true);
    }
}

// --- 4. ՄԻԱՍՆԱԿԱՆ ԳՆՄԱՆ ՖՈՒՆԿՑԻԱ ---
async function handleBuy(event, type, usdAmount, count) {
    if (!wallet) return notify("⚠️ Նախ միացրեք դրամապանակը", true);
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "⏳...";

    const provider = window.phantom?.solana || window.solana;

    try {
        notify(`🚀 Պատրաստում ենք ${type} գործարքը...`);
        let transaction = new solanaWeb3.Transaction();

        if (type === 'SOL') {
            const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await resp.json();
            const lamports = Math.round((usdAmount / data.solana.usd) * 1e9);

            transaction.add(solanaWeb3.SystemProgram.transfer({
                fromPubkey: wallet,
                toPubkey: RECEIVER_PUBKEY,
                lamports: lamports
            }));
        } else if (type === 'USDC') {
            const fromAta = (solanaWeb3.PublicKey.findProgramAddressSync([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()], SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID))[0];
            const toAta = (solanaWeb3.PublicKey.findProgramAddressSync([RECEIVER_PUBKEY.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()], SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID))[0];

            const toAtaInfo = await connection.getAccountInfo(toAta);
            if (!toAtaInfo) {
                // Եթե ստացողի USDC հաշիվը չկա, ավելացնում ենք դրա ստեղծման հրահանգը
                transaction.add(new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: wallet, isSigner: true, isWritable: true },
                        { pubkey: toAta, isSigner: false, isWritable: true },
                        { pubkey: RECEIVER_PUBKEY, isSigner: false, isWritable: false },
                        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
                        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                        { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                    ],
                    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                    data: Uint8Array.from([1]),
                }));
            }

            const amountUnits = BigInt(Math.round(usdAmount * 1_000_000));
            const transferData = new Uint8Array(9);
            transferData[0] = 3; 
            new DataView(transferData.buffer).setBigUint64(1, amountUnits, true);

            transaction.add(new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: fromAta, isSigner: false, isWritable: true },
                    { pubkey: toAta, isSigner: false, isWritable: true },
                    { pubkey: wallet, isSigner: true, isWritable: false }
                ],
                programId: TOKEN_PROGRAM_ID,
                data: transferData
            }));
        }

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet;

        const { signature } = await provider.signAndSendTransaction(transaction);
        notify("🔗 Գործարքը ուղարկված է:");

        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
        
        notify(`🎉 Հաջողություն! Դուք գնեցիք ${count} FYX`);
        window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank');
        
        setTimeout(updateProgressBar, 3000);
    } catch (e) {
        console.error(e);
        notify("❌ Գործարքը ձախողվեց", true);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// --- 5. PROGRESS BAR-Ի ԹԱՐՄԱՑՈՒՄ ---
async function updateProgressBar() {
    try {
        const solBalance = await connection.getBalance(RECEIVER_PUBKEY);
        const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await resp.json();
        const solPrice = data.solana.usd;
        const solInUsd = (solBalance / 1e9) * solPrice;

        const toAta = (solanaWeb3.PublicKey.findProgramAddressSync([RECEIVER_PUBKEY.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()], SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID))[0];
        let usdcInUsd = 0;
        try {
            const tokenBalance = await connection.getTokenAccountBalance(toAta);
            usdcInUsd = tokenBalance.value.uiAmount;
        } catch(e) {}

        const total = solInUsd + usdcInUsd;
        const target = 900000;
        const percent = Math.min((total / target) * 100, 100);

        const raisedEl = document.getElementById('raised-amount');
        const fillEl = document.getElementById('progress-bar-fill');
        const soldEl = document.getElementById('sold-tokens');

        if (raisedEl) raisedEl.innerText = `$${Math.round(total).toLocaleString()}`;
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (soldEl) soldEl.innerText = `${Math.round(total / 0.009).toLocaleString()} FYX`;
    } catch(e) { console.error("Update Error:", e); }
}

// Լսողներ (Event Listeners)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectBtn')?.addEventListener('click', connectWallet);
    updateProgressBar();
});