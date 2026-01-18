// usdc-logic.js — USDC գնման տրամաբանություն (առանց առանձին spl-token գրադարանի)

const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const USDC_MINT = new solanaWeb3.PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
const RECEIVER = new solanaWeb3.PublicKey("6ynnHZA4jr9izeoyT9iGuJTJvDnpxmfgMcnF1fXh1WeS");

const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerText = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 5000);
    } else {
        alert(msg);
    }
}

// ATA ստեղծման instruction (web3.js-ից)
function getAssociatedTokenAddressSync(mint, owner) {
    return solanaWeb3.PublicKey.findProgramAddressSync(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
}

// ATA ստեղծման instruction
function createAssociatedTokenAccountInstruction(payer, ata, owner, mint) {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: ata, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new solanaWeb3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.alloc(0),
    });
}

// Transfer instruction (manual)
function createTransferInstruction(source, destination, owner, amount) {
    const data = Buffer.alloc(9);
    data.writeUInt8(3, 0); // Transfer instruction code
    data.writeBigUInt64LE(BigInt(amount), 1);

    const keys = [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
    ];

    return new solanaWeb3.TransactionInstruction({
        keys,
        programId: TOKEN_PROGRAM_ID,
        data,
    });
}

window.initiateUSDCBuy = async function(usdAmount, tokenQty) {
    if (!window.walletPublicKey) {
        showToast("Նախ միացրեք Phantom դրամապանակը");
        return;
    }

    const provider = window.phantom?.solana || window.solana;
    if (!provider) {
        showToast("Phantom wallet-ը չի գտնվել");
        return;
    }

    try {
        showToast("Գործարքը նախապատրաստվում է...");

        const transaction = new solanaWeb3.Transaction();

        const sourceATA = getAssociatedTokenAddressSync(USDC_MINT, window.walletPublicKey);
        const destATA = getAssociatedTokenAddressSync(USDC_MINT, RECEIVER);

        const sourceInfo = await connection.getAccountInfo(sourceATA);
        if (!sourceInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    window.walletPublicKey,
                    sourceATA,
                    window.walletPublicKey,
                    USDC_MINT
                )
            );
        }

        const destInfo = await connection.getAccountInfo(destATA);
        if (!destInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    window.walletPublicKey,
                    destATA,
                    RECEIVER,
                    USDC_MINT
                )
            );
        }

        const amountUnits = BigInt(usdAmount * 1_000_000);
        transaction.add(
            createTransferInstruction(
                sourceATA,
                destATA,
                window.walletPublicKey,
                amountUnits
            )
        );

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = window.walletPublicKey;

        const signedTx = await provider.signAndSendTransaction(transaction);

        showToast("Սպասում ենք հաստատման...");
        await connection.confirmTransaction({
            signature: signedTx.signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        showToast(`🎉 Հաջողությամբ գնվել է ${tokenQty} FYX!`);

    } catch (error) {
        console.error("USDC գնման սխալ:", error);
        let msg = "Գործարքը ձախողվեց 😔";
        if (error.message?.includes("User rejected")) msg = "Դուք չեղարկել եք Phantom-ում";
        if (error.message?.includes("insufficient")) msg = "Անբավարար USDC կամ SOL fee-ի համար";
        showToast(msg);
    }
};