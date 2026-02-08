async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Տվյալները թարմացվեցին:", data);

        // Ուղղում. Օգտագործում ենք total_collected, քանի որ քո բազան այդպես է վերադարձնում
        // Եթե տվյալը չկա, դնում ենք 0, որպեսզի toLocaleString-ը չկոտրվի
        const raised = data.total_collected || 0; 
        const goal = data.goal || 900000;
        const sold = data.sold || 0;
        const remaining = data.remaining || 0;

        // 1. Թարմացնում ենք հավաքված գումարը
        const raisedText = document.getElementById('raised-amount');
        if (raisedText) {
            raisedText.innerText = `$${raised.toLocaleString()}`;
        }

        // 2. Թարմացնում ենք Progress Bar-ը
        const barFill = document.getElementById('progress-bar-fill');
        if (barFill) {
            const percent = (raised / goal) * 100;
            barFill.style.width = `${Math.min(percent, 100)}%`;
        }

        // 3. Թարմացնում ենք մնացած թվերը
        const soldEl = document.getElementById('sold-tokens');
        if (soldEl) {
            soldEl.innerText = `${sold.toLocaleString()} FYX`;
        }
        
        const remainingEl = document.getElementById('remaining-tokens');
        if (remainingEl) {
            remainingEl.innerText = `${remaining.toLocaleString()} FYX`;
        }

    } catch (err) {
        console.warn("⚠️ Progress-ի թարմացման սխալ:", err.message);
    }
}

// Գործարկում ենք ֆունկցիան
refreshStats();
// Թարմացնում ենք ամեն 10 վայրկյանը մեկ
setInterval(refreshStats, 10000);