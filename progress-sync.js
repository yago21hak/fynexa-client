async function refreshStats() {
    try {
        // Մենք դիմում ենք ուղիղ մեր սարքած API-ին
        const response = await fetch('/api/stats');
        
        // Ստուգում ենք՝ արդյոք պատասխանը JSON է
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Տվյալները թարմացվեցին:", data);

        // 1. Թարմացնում ենք հավաքված գումարը ($150)
        const raisedText = document.getElementById('raised-amount');
        if (raisedText) {
            raisedText.innerText = `$${data.raised.toLocaleString()}`;
        }

        // 2. Թարմացնում ենք Progress Bar-ի կապույտ մասը
        const barFill = document.getElementById('progress-bar-fill');
        if (barFill) {
            const percent = (data.raised / data.goal) * 100;
            barFill.style.width = `${Math.min(percent, 100)}%`;
        }

        // 3. Թարմացնում ենք մնացած թվերը
        if (document.getElementById('sold-tokens')) {
            document.getElementById('sold-tokens').innerText = `${data.sold.toLocaleString()} FYX`;
        }
        if (document.getElementById('remaining-tokens')) {
            document.getElementById('remaining-tokens').innerText = `${data.remaining.toLocaleString()} FYX`;
        }

    } catch (err) {
        console.warn("⚠️ Progress-ի թարմացման սխալ:", err.message);
    }
}

// Գործարկում ենք ֆունկցիան
refreshStats();
// Թարմացնում ենք ամեն 10 վայրկյանը մեկ
setInterval(refreshStats, 10000);