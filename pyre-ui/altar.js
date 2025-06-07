// altar.js - Fetches Solana + Base RPC, renders the fire

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 Real Blockchain Altar is ready - connecting to live networks...');

    // Get DOM elements for settings
    const solanaRpcUrlInput = document.getElementById('solana-rpc-url');
    const baseRpcUrlInput = document.getElementById('base-rpc-url');
    const walletAddressInput = document.getElementById('wallet-address');
    const updateSettingsButton = document.getElementById('update-settings-button');
    const totalBurnedElem = document.getElementById('total-burned');
    const lastTxIdElem = document.getElementById('last-tx-id');

    // Function to fetch REAL burn stats from blockchain RPC endpoints
    async function fetchBurnStats() {
        // Read current values from input fields
        const solanaRpcUrl = solanaRpcUrlInput ? solanaRpcUrlInput.value : '';
        const baseRpcUrl = baseRpcUrlInput ? baseRpcUrlInput.value : '';
        const walletAddress = walletAddressInput ? walletAddressInput.value : '';

        if (!solanaRpcUrlInput || !baseRpcUrlInput || !walletAddressInput || !totalBurnedElem || !lastTxIdElem) {
            console.error('One or more required DOM elements are missing for fetching stats.');
            if (totalBurnedElem) totalBurnedElem.textContent = 'Configuration error.';
            if (lastTxIdElem) lastTxIdElem.textContent = 'N/A';
            return;
        }
        
        console.log(`🔥 Fetching REAL burn stats for wallet: ${walletAddress}`);
        console.log(`🔥 Using Solana RPC: ${solanaRpcUrl}`);
        console.log(`🔥 Using Base RPC: ${baseRpcUrl}`);

        totalBurnedElem.textContent = 'Loading real blockchain data...';
        lastTxIdElem.textContent = 'Querying networks...';

        try {
            // Initialize the blockchain API
            const blockchainAPI = new window.BlockchainAPI();
            
            // Fetch real burn statistics from both networks
            const burnData = await blockchainAPI.getBurnStatistics(
                solanaRpcUrl, 
                baseRpcUrl, 
                walletAddress
            );

            // Update the UI with real data
            const totalBurned = burnData.combined.totalBurned;
            const lastTxId = burnData.combined.lastTransaction;

            totalBurnedElem.textContent = `🔥 ${totalBurned.toLocaleString()} Real Tokens Tracked (Solana + Base)`;
            lastTxIdElem.textContent = lastTxId;
            
            console.log('🔥 REAL burn stats updated:', {
                totalBurned,
                lastTxId,
                solanaData: burnData.solana,
                baseData: burnData.base,
                timestamp: burnData.combined.timestamp
            });
            
            // Add visual feedback for successful real data fetch
            totalBurnedElem.style.color = '#ff6347';
            totalBurnedElem.style.fontWeight = 'bold';
            
        } catch (error) {
            console.error('🔥 Error fetching REAL burn stats:', error.message);
            totalBurnedElem.textContent = `Real network error: ${error.message}`;
            lastTxIdElem.textContent = 'Check RPC URLs and try again';
            
            // Add visual feedback for errors
            totalBurnedElem.style.color = '#ff4444';
        }
    }

    // Event listener for the button
    if (updateSettingsButton) {
        updateSettingsButton.addEventListener('click', fetchBurnStats);
    } else {
        console.error('Update settings button not found.');
    }

    // Initial fetch and periodic update
    fetchBurnStats(); // Initial call
    setInterval(fetchBurnStats, 30000); // Periodic update

    // Placeholder for rendering the fire on canvas
    function renderFire() {
        const canvas = document.getElementById('fire-canvas');
        if (!canvas || !canvas.getContext) {
            console.error('Canvas not supported or not found.');
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200; // Keep a fixed height or make it responsive

        let particles = [];
        const particleCount = 150; // Increased particle count for a fuller fire
        const baseHue = 10; // Orange-red base hue

        function createParticle(x, y) {
            const size = Math.random() * 7 + 3; // Slightly larger particles
            const speedY = Math.random() * 2 + 1;
            // Start from bottom center, spread outwards
            const angle = Math.random() * Math.PI * 0.4 - Math.PI * 0.2; // -36 to +36 degrees from vertical
            const speedX = Math.sin(angle) * (Math.random() * 2);
            const life = Math.random() * 100 + 100; // Lifespan of particle

            return {
                x: x || canvas.width / 2,
                y: y || canvas.height,
                size: size,
                speedX: speedX,
                speedY: speedY,
                color: `hsla(${baseHue + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%, ${Math.random() * 0.5 + 0.5})`, // HSL for better color control (oranges, yellows)
                life: life,
                initialLife: life,
            };
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, index) => {
                ctx.beginPath();
                // Fade out particles as they age
                ctx.fillStyle = `hsla(${baseHue + Math.random() * 20}, 100%, ${50 + Math.random() * 10}%, ${(p.life / p.initialLife) * 0.8})`;
                ctx.arc(
                    p.x,
                    p.y,
                    p.size * (p.life / p.initialLife),
                    0,
                    Math.PI * 2
                ); // Shrink particles
                ctx.fill();

                p.y -= p.speedY;
                p.x += p.speedX;
                p.life--;

                // Add slight wind/sway effect
                p.speedX += (Math.random() - 0.5) * 0.2;
                if (Math.abs(p.speedX) > 1) p.speedX = p.speedX > 0 ? 1 : -1;

                // Reset particle when it dies or goes off screen
                if (p.y < 0 || p.life <= 0) {
                    particles[index] = createParticle();
                }
            });
            requestAnimationFrame(draw);
        }
        draw();
        console.log('Enhanced fire animation started.');
    }

    renderFire();
});
