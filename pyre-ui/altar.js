// altar.js - Fetches Solana + Base RPC, renders the fire

document.addEventListener('DOMContentLoaded', () => {
    console.log("Altar is ready.");

    // Function to fetch burn stats from simulated RPC endpoints
    async function fetchBurnStats() {
        console.log("Fetching burn stats...");
        const solanaRpcUrl = 'https://api.mainnet-beta.solana.com'; // Example, not actually called
        const baseRpcUrl = 'https://mainnet.base.org'; // Example, not actually called

        // Simulate API call to Solana
        const fetchSolanaData = new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate a successful response or an error
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({
                        totalBurnedOnSolana: Math.floor(Math.random() * 500000) + 700000,
                        lastTxIdSolana: '0xsol' + Math.random().toString(16).slice(2, 12)
                    });
                } else {
                    reject(new Error("Failed to fetch data from Solana RPC"));
                }
            }, 800);
        });

        // Simulate API call to Base
        const fetchBaseData = new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate a successful response or an error
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({
                        totalBurnedOnBase: Math.floor(Math.random() * 300000) + 200000,
                        lastTxIdBase: '0xbase' + Math.random().toString(16).slice(2, 12)
                    });
                } else {
                    reject(new Error("Failed to fetch data from Base RPC"));
                }
            }, 1200);
        });

        try {
            const [solanaData, baseData] = await Promise.all([fetchSolanaData, fetchBaseData]);

            const totalBurned = solanaData.totalBurnedOnSolana + baseData.totalBurnedOnBase;
            // For simplicity, we'll just show the Solana TX ID as the 'last' one.
            // A real implementation might want to show both or the latest of the two.
            const lastTxId = solanaData.lastTxIdSolana;

            document.getElementById('total-burned').textContent = `${totalBurned.toLocaleString()} Tokens Burned (Solana + Base)`;
            document.getElementById('last-tx-id').textContent = lastTxId;
            console.log("Burn stats updated:", { totalBurned, lastTxId });

        } catch (error) {
            console.error("Error fetching burn stats:", error.message);
            document.getElementById('total-burned').textContent = "Error loading stats.";
            document.getElementById('last-tx-id').textContent = "N/A";
        }
    }

    // Placeholder for rendering the fire on canvas
    function renderFire() {
        const canvas = document.getElementById('fire-canvas');
        if (canvas.getContext) {
            const ctx = canvas.getContext('2d');
            // Basic fire particle simulation (very simplified)
            let particles = [];
            const particleCount = 100;

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height,
                    size: Math.random() * 5 + 1,
                    speedY: Math.random() * 3 + 1,
                    color: `rgba(${Math.floor(Math.random() * 56 + 200)}, ${Math.floor(Math.random() * 50 + 50)}, 0, ${Math.random()})`
                });
            }

            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    ctx.beginPath();
                    ctx.fillStyle = p.color;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();

                    p.y -= p.speedY;
                    if (p.y < 0) {
                        p.y = canvas.height;
                        p.x = Math.random() * canvas.width;
                    }
                });
                requestAnimationFrame(draw);
            }
            draw();
            console.log("Fire animation started.");
        } else {
            console.error("Canvas not supported or not found.");
        }
    }

    fetchBurnStats();
    // Periodically update stats every 30 seconds
    setInterval(fetchBurnStats, 30000);
    renderFire();
});
