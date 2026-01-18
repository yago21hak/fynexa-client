async function refreshStats() {
    try {
        const response = await fetch('https://fynexa-client.vercel.app/');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        const raisedUSD = Number(data.raised) || 0;
        const soldFYX = Number(data.sold) || 0;
        const remainingFYX = Number(data.remaining) || 100000000;
        const goalUSD = Number(data.goal) || 900000;

        const percent = goalUSD > 0 ? (raisedUSD / goalUSD) * 100 : 0;

        // DOM update
        const barFill = document.getElementById('progress-bar-fill');
        const raisedText = document.getElementById('raised-amount');
        const soldText = document.getElementById('sold-tokens');
        const remainingText = document.getElementById('remaining-tokens');

        if (barFill) barFill.style.width = `${Math.min(percent, 100)}%`;
        if (raisedText) raisedText.innerText = `$${raisedUSD.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
        if (soldText) soldText.innerText = `${soldFYX.toLocaleString('en-US')} FYX`;
        if (remainingText) remainingText.innerText = `${remainingFYX.toLocaleString('en-US')} FYX`;

        console.log(`✅ Progress թարմացվել է՝ $${raisedUSD}, ${soldFYX} FYX (${percent.toFixed(1)}%)`);

    } catch (err) {
        console.warn("⚠️ Backend կապի խնդիր:", err.message);
    }
}

// Թարմացում ամեն 10 վայրկյանը
setInterval(refreshStats, 10000);
refreshStats(); // Անմիջապես