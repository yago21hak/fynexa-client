// wallet-logic.js
window.walletPublicKey = null;
let _provider = null;

// Ֆունկցիա՝ հայտնաբերելու հասանելի դրամապանակը
const getProvider = () => {
    if ('solana' in window) {
        const provider = window.solana;
        if (provider.isPhantom || provider.isSolflare || provider.isBackpack) {
            return provider;
        }
    }
    // Եթե ստանդարտ window.solana-ն չկա, փորձում ենք գտնել ըստ տեսակի
    return window.phantom?.solana || window.solflare || window.backpack;
};

async function connectWallet() {
    _provider = getProvider();

    if (!_provider) {
        alert("Web3 դրամապանակ չի գտնվել: Խնդրում ենք տեղադրել Phantom կամ Solflare:");
        return;
    }

    try {
        // Միանում ենք հայտնաբերված դրամապանակին
        const resp = await _provider.connect();
        window.walletPublicKey = resp.publicKey;
        
        const addr = resp.publicKey.toBase58();
        console.log("Միացված է:", addr);

        // Թարմացնում ենք կոճակը
        const btn = document.getElementById('connectBtn');
        if (btn) {
            btn.innerText = addr.slice(0, 4) + "..." + addr.slice(-4);
        }

        // Ակտիվացնում ենք գնման կոճակները
        document.querySelectorAll('.buy-btn').forEach(b => b.disabled = false);

    } catch (err) {
        console.error("Միացման սխալ:", err);
        alert("Չհաջողվեց միանալ դրամապանակին:");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('connectBtn');
    if (btn) btn.addEventListener('click', connectWallet);
});