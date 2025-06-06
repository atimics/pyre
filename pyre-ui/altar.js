// altar.js - Fetches Solana + Base RPC, renders the fire

document.addEventListener('DOMContentLoaded', () => {
    console.log("Altar is ready.");

    // Placeholder for fetching burn totals and last TX-ID
    function fetchBurnStats() {
        // Simulate fetching data
        setTimeout(() => {
            document.getElementById('total-burned').textContent = "1,234,567 Tokens Burned";
            document.getElementById('last-tx-id').textContent = "0xabc123def456ghi789";
            console.log("Burn stats updated.");
        }, 1000);
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
    renderFire();
});
