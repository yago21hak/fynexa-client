import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); 
const RECEIVER_WALLET = new PublicKey("2dhRmqmNwnFC6BKYDmy6HqQvyekkZ8MGDVbjzUSHdU8S");
const TOKEN_PRICE = 0.009;

const App = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleBuy = async (amount) => {
    if (!publicKey) return alert("Խնդրում ենք նախ միացնել Phantom-ը");
    setLoading(true);
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const toAta = await getAssociatedTokenAddress(USDC_MINT, RECEIVER_WALLET);

      const transaction = new Transaction().add(
        createTransferCheckedInstruction(
          fromAta, USDC_MINT, toAta, publicKey,
          Math.round(amount * TOKEN_PRICE * 1_000_000), 6
        )
      );

      const signature = await sendTransaction(transaction, connection);
      alert(`🎉 Հաջողվեց! Signature: ${signature}`);
    } catch (error) {
      console.error(error);
      alert("Գործարքը մերժվեց: Ստուգեք ձեր մնացորդը:");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    wrapper: { backgroundColor: '#050505', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', padding: '40px 10px', textAlign: 'center' },
    header: { fontSize: '42px', fontWeight: '900', marginBottom: '10px' },
    subTitle: { color: '#888', fontSize: '18px', marginBottom: '40px' },
    grid: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto' },
    card: { backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '30px', width: '280px', textAlign: 'center', transition: '0.3s' },
    tokenName: { fontSize: '26px', color: '#a78bfa', fontWeight: 'bold', marginBottom: '10px' },
    price: { color: '#555', fontSize: '16px', marginBottom: '25px' },
    // Կոճակի ոճը թարմացվել է ըստ քո ուզածի
    btn: (active, isLoading) => ({
      width: '100%', 
      padding: '12px', 
      borderRadius: '12px', 
      border: 'none', 
      fontWeight: 'bold', 
      fontSize: '15px',
      backgroundColor: active ? (isLoading ? '#444' : '#6d28d9') : '#1a1a1a', 
      color: active ? 'white' : '#444',
      cursor: isLoading || !active ? 'not-allowed' : 'pointer', 
      transition: '0.3s'
    })
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.header}>FYX Private Sale</h1>
      <p style={styles.subTitle}>Գինը: <span style={{color: '#a78bfa'}}>0.009 USDC</span> / 1 FYX</p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '50px' }}>
        <WalletMultiButton style={{ backgroundColor: '#6d28d9', borderRadius: '10px' }} />
      </div>

      <div style={styles.grid}>
        {[1000, 5000, 10000].map((amt) => (
          <div key={amt} style={styles.card}>
            <div style={styles.tokenName}>{amt.toLocaleString()} FYX</div>
            <p style={styles.price}>Արժեքը: {(amt * TOKEN_PRICE).toFixed(2)} USDC</p>
            <button 
              onClick={() => handleBuy(amt)}
              disabled={loading || !publicKey}
              style={styles.btn(publicKey, loading)}
            >
              {loading ? "Մշակվում է..." : !publicKey ? "Միացրու կաշիլոկը" : `Գնել ${amt} FYX`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;