# pyre
Rati's Funeral Pyre
Yup — a one‑shot “funeral‑pyre” front‑end on Arweave is totally doable

Below is a minimal recipe that (1) ships a static web‑app to the permaweb in a single command and (2) lets your off‑chain AI cycle light the 0x8e55… wallet on every turn.

⸻

1. Bundle everything into a static folder

pyre-ui/
 ├─ index.html       ← shows latest burn totals, last‑cycle tx‑id
 ├─ altar.js         ← fetches Solana + Base RPC, renders the fire
 ├─ style.css
 └─ assets/…

All logic that actually signs / burns lives in your AI bot or Cron job, not in the browser code — the page just reads the chain and chants the stats.

⸻

2. “Publish in one shot” with ArkB + Bundlr

# install once
npm i -g arkb          # ⏳ 5 s

# fund Bundlr (optional, free <100 KB)
arkb fund-bundler 0.005 --use-bundler https://node2.bundlr.network \
  --wallet ar_key.json

# ship the whole site
arkb deploy ./pyre-ui --use-bundler https://node2.bundlr.network \
  --wallet ar_key.json --tag-name App-Name --tag-value "FuneralPyre"

ArkB detects the folder, bundles every file, and returns a TX‑ID.
Your site is instantly reachable at https://arweave.net/<TX‑ID>/index.html.  ￼

(Prefer Bundlr: one Arweave tx, milliseconds to confirm, pennies in fees.)

⸻

3. How the cycle keeps burning without on‑chain code

┌────────────┐        swap+burn            ┌───────────┐
│  Cron / AI │  ———————————————►  Solana RPC │ 0x8e55... │
└────────────┘                             └───────────┘
      │   poll stats (JSON‑RPC)                    ▲
      └──────────────┐                             │
                     ▼                             │
            Funeral‑Pyre UI  (Arweave) ────────────┘

	1.	AI cycle script (could be ChatGPT function calling, a Node cron, or Chainlink Automation):
	•	pulls SOL from the multisig
	•	Jupiter swap → PUMP → spl_token::burn
	•	logs the burn tx‑sig to Matrix / Farcaster
	2.	altar.js hits public RPC (Helius / Ankr) every few seconds, updates DOM.
No secrets in the browser; the 8e55 key stays in your off‑chain bot.

⸻

4. Want the burn loop serverless & immortal?

Drop the swap+burn logic into an EXM serverless function (Arweave’s permanent Lambda):

npx exm-cli deploy burnCycle.js --wallet ar_key.json
# returns functionId you can call on a schedule

Execution Machine stores the code & state on Arweave, so even if your VPS dies the ritual can be re‑invoked by anyone holding the functionId.  ￼

Trigger it with:

exm-cli write --function <functionId> --input '{"action":"burn","budget":100000000}'

…and wire that into a free Bundlr Cron‑job or external keeper.

⸻

5. Safety tips for a public‑key pyre

Risk	Mitigation
Someone injects extra JS into the permaweb bundle	Pin the repo commit hash in README; verify TX‑ID in contracts/ docs.
Bots frontrun SOL→PUMP swap	Keep swap+burn atomic (one Solana tx) inside Anchor CPI.
Arweave fee spike	Use Bundlr “pay‑as‑you‑go” node; you pre‑fund tiny amounts.
8e55 key leak lets attacker send unburned SOL elsewhere	Drip only today’s fuel; keep treasury SOL/NFTs in your timelocked multisig.


⸻

TL;DR
	1.	arkb deploy ./pyre-ui --use-bundler … → site lives forever on Arweave.
	2.	Your AI cron continues the SOL → PUMP → burn dance with the 8e55 wallet.
	3.	If you later want a totally self‑contained, on‑chain loop, port the burn script to EXM and schedule interactions — still no servers.

Light it once, and the fire can be rekindled by anyone who finds the TX‑ID and the run‑book. 🌋
