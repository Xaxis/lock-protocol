# LOCK Protocol – Extensive Question & Answer Compendium  
*Version 1.0*  

---

## How to Read This Document  
- **Structure** Each section is self-contained. You can jump straight to “Product QAs,” skim the “Security QAs,” or dive into the philosophical “Pragmatic QAs.”  
- **Style** Every question appears as a third-level heading (`###`), immediately followed by its answer in regular paragraphs. No tables are used; line breaks and bullet lists keep long answers readable.  
- **Coverage** Questions range from beginner basics to obscure edge-cases, unasked concerns, speculative futures, and implementation gotchas. If you think a question is missing, it probably lives in a different section—check the Contents.  

---

### Basic QAs  
- [B-1 What is LOCK in a single breath?](#b-1-what-is-lock-in-a-single-breath)  
- [B-2 Why call the encrypted object a “SEAL”?](#b-2-why-call-the-encrypted-object-a-seal)  
- [B-3 What are the exact steps of sealing?](#b-3-what-are-the-exact-steps-of-sealing)  
- [B-4 Does sealing cost any on-chain fee?](#b-4-does-sealing-cost-any-on-chain-fee)  
- [B-5 Define “binding” precisely.](#b-5-define-binding-precisely)  
- [B-6 Is the binding txid used in key derivation?](#b-6-is-the-binding-txid-used-in-key-derivation)  
- [B-7 Explain Proof-of-Access (PoA) like I’m five.](#b-7-explain-proof-of-access-poa-like-im-five)  
- [B-8 How does PoA differ from Bitcoin Script?](#b-8-how-does-poa-differ-from-bitcoin-script)  
- [B-9 Why ECDH ➜ HKDF instead of directly hashing keys?](#b-9-why-ecdh➜hkdf-instead-of-directly-hashing-keys)  
- [B-10 What does HKDF’s salt and info contain?](#b-10-what-does-hkdfs-salt-and-info-contain)  
- [B-11 What is AEAD and why is it mandatory?](#b-11-what-is-aead-and-why-is-it-mandatory)  
- [B-12 Why default to AES-256-GCM but mention ChaCha20-Poly1305?](#b-12-why-default-to-aes-256-gcm-but-mention-chacha20-poly1305)  
- [B-13 What exactly is a PSBT?](#b-13-what-exactly-is-a-psbt)  
- [B-14 Describe the per-input map inside a PSBT.](#b-14-describe-the-per-input-map-inside-a-psbt)  
- [B-15 Can vaults mandate multisig spends?](#b-15-can-vaults-mandate-multisig-spends)  
- [B-16 How does an unlock-limit work under the hood?](#b-16-how-does-an-unlock-limit-work-under-the-hood)  
- [B-17 Are time-locked vaults possible?](#b-17-are-time-locked-vaults-possible)  
- [B-18 Who stores the SEAL and where should it live?](#b-18-who-stores-the-seal-and-where-should-it-live)  
- [B-19 Can metadata ever be public?](#b-19-can-metadata-ever-be-public)  
- [B-20 Does LOCK demand new opcodes or sidechains?](#b-20-does-lock-demand-new-opcodes-or-sidechains)  
- [B-21 Explain change outputs in this context.](#b-21-explain-change-outputs-in-this-context)  
- [B-22 Is there a protocol-level minimum fee?](#b-22-is-there-a-protocol-level-minimum-fee)  
- [B-23 May an unlocker over-pay the required amount?](#b-23-may-an-unlocker-over-pay-the-required-amount)  
- [B-24 How do hardware wallets integrate safely?](#b-24-how-do-hardware-wallets-integrate-safely)  
- [B-25 Do SEALs support multi-file archives?](#b-25-do-seals-support-multi-file-archives)  
- [B-26 Is there a practical size limit for a SEAL?](#b-26-is-there-a-practical-size-limit-for-a-seal)  
- [B-27 What happens if the unlocker never comes online?](#b-27-what-happens-if-the-unlocker-never-comes-online)  
- [B-28 Can a SEAL be resealed with different rules?](#b-28-can-a-seal-be-resealed-with-different-rules)  
- [B-29 Is LOCK compatible with Taproot key-paths?](#b-29-is-lock-compatible-with-taproot-key-paths)  
- [B-30 How does the protocol identify duplicate SEAL IDs?](#b-30-how-does-the-protocol-identify-duplicate-seal-ids)

### Product QAs  
- [P-1 Minimum viable product concept.](#p-1-minimum-viable-product-concept)  
- [P-2 Media outlet pay-per-article workflow.](#p-2-media-outlet-pay-per-article-workflow)  
- [P-3 Software-licence vending via SEALs.](#p-3-software-licence-vending-via-seals)  
- [P-4 Subscription models with rolling reseals.](#p-4-subscription-models-with-rolling-reseals)  
- [P-5 Whistle-blower dead-man’s switch.](#p-5-whistle-blower-dead-mans-switch)  
- [P-6 Censorship-resistant ticketing.](#p-6-censorship-resistant-ticketing)  
- [P-7 Royalties and revenue splits baked in.](#p-7-royalties-and-revenue-splits-baked-in)  
- [P-8 API pay-as-you-go tokens.](#p-8-api-pay-as-you-go-tokens)  
- [P-9 Zero-backend progressive web app.](#p-9-zero-backend-progressive-web-app)  
- [P-10 LOCK + Lightning hybrid design.](#p-10-lock--lightning-hybrid-design)  
- [P-11 Pain points & UX remediation.](#p-11-pain-points--ux-remediation)  
- [P-12 Firmware signer display suggestions.](#p-12-firmware-signer-display-suggestions)  
- [P-13 Marketplace and indexer blueprint.](#p-13-marketplace-and-indexer-blueprint)  
- [P-14 Creator compliance dashboard.](#p-14-creator-compliance-dashboard)  
- [P-15 Refund mechanics and philosophy.](#p-15-refund-mechanics-and-philosophy)  
- [P-16 Dual-licencing with LOCK gating.](#p-16-dual-licencing-with-lock-gating)  
- [P-17 Charity pay-to-reveal campaigns.](#p-17-charity-pay-to-reveal-campaigns)  
- [P-18 Limited-time sales & expiry blocks.](#p-18-limited-time-sales--expiry-blocks)  
- [P-19 Education attendance proofs.](#p-19-education-attendance-proofs)  
- [P-20 Book pre-sales and community funding.](#p-20-book-pre-sales-and-community-funding)  
- [P-21 Sealed machine-learning models.](#p-21-sealed-machine-learning-models)  
- [P-22 IoT firmware distribution pipeline.](#p-22-iot-firmware-distribution-pipeline)  
- [P-23 Static-site generator integration.](#p-23-static-site-generator-integration)  
- [P-24 Vault-as-a-Service platform idea.](#p-24-vault-as-a-service-platform-idea)  
- [P-25 LOCK-powered generative-art drops.](#p-25-lock-powered-generative-art-drops)

### Security QAs  
- [S-1 IV reuse catastrophe explained.](#s-1-iv-reuse-catastrophe-explained)  
- [S-2 Replace-By-Fee resilience strategies.](#s-2-replace-by-fee-resilience-strategies)  
- [S-3 Replay attack defence via salt design.](#s-3-replay-attack-defence-via-salt-design)  
- [S-4 Ciphertext-length side-channel mitigations.](#s-4-ciphertext-length-side-channel-mitigations)  
- [S-5 Metadata privacy and public hints.](#s-5-metadata-privacy-and-public-hints)  
- [S-6 Chain re-org handling guidelines.](#s-6-chain-re-org-handling-guidelines)  
- [S-7 Miner censorship economics.](#s-7-miner-censorship-economics)  
- [S-8 Quantum threat model and upgrades.](#s-8-quantum-threat-model-and-upgrades)  
- [S-9 Fee sniping vectors and countermeasures.](#s-9-fee-sniping-vectors-and-countermeasures)  
- [S-10 Randomness APIs & entropy auditing.](#s-10-randomness-apis--entropy-auditing)  
- [S-11 Corrupted SEAL detection workflow.](#s-11-corrupted-seal-detection-workflow)  
- [S-12 Denial-of-Service on public gateways.](#s-12-denial-of-service-on-public-gateways)  
- [S-13 Sealer private-key compromise scope.](#s-13-sealer-private-key-compromise-scope)  
- [S-14 Unlock-counter integrity.](#s-14-unlock-counter-integrity)  
- [S-15 On-chain privacy leakage assessment.](#s-15-on-chain-privacy-leakage-assessment)  
- [S-16 Dust output fallout.](#s-16-dust-output-fallout)  
- [S-17 Recipient address compromise strategies.](#s-17-recipient-address-compromise-strategies)  
- [S-18 SHA-256 collision risk.](#s-18-sha-256-collision-risk)  
- [S-19 Timing side-channel in tag checks.](#s-19-timing-side-channel-in-tag-checks)  
- [S-20 Client compliance test-suite design.](#s-20-client-compliance-test-suite-design)  
- [S-21 Sybil attack on vault discovery.](#s-21-sybil-attack-on-vault-discovery)  
- [S-22 Long-term key rotation policies.](#s-22-long-term-key-rotation-policies)  
- [S-23 Multi-tenant hosting isolation.](#s-23-multi-tenant-hosting-isolation)  
- [S-24 Malware-injected pay-to-unlock loops.](#s-24-malware-injected-pay-to-unlock-loops)  
- [S-25 Credential-stuffing equivalent for PoA.](#s-25-credential-stuffing-equivalent-for-poa)  
- [S-26 Hardware wallet supply-chain risk.](#s-26-hardware-wallet-supply-chain-risk)  
- [S-27 Electrum MITM when verifying txids.](#s-27-electrum-mitm-when-verifying-txids)  
- [S-28 Cold-storage sealer best practices.](#s-28-cold-storage-sealer-best-practices)  
- [S-29 Side-loaded browser extension attacks.](#s-29-side-loaded-browser-extension-attacks)  
- [S-30 Legal subpoenas and compelled decryption.](#s-30-legal-subpoenas-and-compelled-decryption)  
- [S-31 Service-worker cache poisoning.](#s-31-service-worker-cache-poisoning)  
- [S-32 Cross-SEAL hash collision scenario.](#s-32-cross-seal-hash-collision-scenario)  
- [S-33 Red-team checklist for product audits.](#s-33-red-team-checklist-for-product-audits)  
- [S-34 Client-side mempool spy defence.](#s-34-client-side-mempool-spy-defence)  
- [S-35 Insurance considerations for custodial hosts.](#s-35-insurance-considerations-for-custodial-hosts)

### Pragmatic QAs  
- [PR-1 Why proof-of-work beats identity systems.](#pr-1-why-proof-of-work-beats-identity-systems)  
- [PR-2 Is LOCK just another form of DRM?](#pr-2-is-lock-just-another-form-of-drm)  
- [PR-3 Complementarity with Lightning paywalls.](#pr-3-complementarity-with-lightning-paywalls)  
- [PR-4 Government censorship prospects.](#pr-4-government-censorship-prospects)  
- [PR-5 Will unlock spam bloat the chain?](#pr-5-will-unlock-spam-bloat-the-chain)  
- [PR-6 Knowledge paywalls vs free culture.](#pr-6-knowledge-paywalls-vs-free-culture)  
- [PR-7 Circular-economy impact.](#pr-7-circular-economy-impact)  
- [PR-8 Marketplace centralisation risks.](#pr-8-marketplace-centralisation-risks)  
- [PR-9 Environmental footprint narrative.](#pr-9-environmental-footprint-narrative)  
- [PR-10 Open-source ethos compatibility.](#pr-10-open-source-ethos-compatibility)  
- [PR-11 Dark-market facilitation debate.](#pr-11-dark-market-facilitation-debate)  
- [PR-12 Privacy vs transparency trade-offs.](#pr-12-privacy-vs-transparency-trade-offs)  
- [PR-13 “Internet 1995 but with native money.”](#pr-13-internet-1995-but-with-native-money)  
- [PR-14 Socio-economic stratification concerns.](#pr-14-socio-economic-stratification-concerns)  
- [PR-15 Role in academic publishing disruption.](#pr-15-role-in-academic-publishing-disruption)  
- [PR-16 Potential for civic-funded journalism.](#pr-16-potential-for-civic-funded-journalism)  
- [PR-17 Impact on creative commons licensing.](#pr-17-impact-on-creative-commons-licensing)  
- [PR-18 Legal jurisdiction challenges.](#pr-18-legal-jurisdiction-challenges)  
- [PR-19 Miner Extractable Value on high-value vaults.](#pr-19-miner-extractable-value-on-high-value-vaults)  
- [PR-20 Currency substitution and dollar off-ramps.](#pr-20-currency-substitution-and-dollar-off-ramps)

### Future QAs  
- [F-1 Formal verification roadmap.](#f-1-formal-verification-roadmap)  
- [F-2 Taproot commitment design.](#f-2-taproot-commitment-design)  
- [F-3 Oracle-driven conditional unlocks.](#f-3-oracle-driven-conditional-unlocks)  
- [F-4 Post-quantum cipher-suite migration.](#f-4-post-quantum-cipher-suite-migration)  
- [F-5 Cross-chain PoA vision.](#f-5-cross-chain-poa-vision)  
- [F-6 Zero-knowledge unlock proofs.](#f-6-zero-knowledge-unlock-proofs)  
- [F-7 Reference implementation wishlist.](#f-7-reference-implementation-wishlist)  
- [F-8 Foundation or consortium governance.](#f-8-foundation-or-consortium-governance)  
- [F-9 Nostr integration pathways.](#f-9-nostr-integration-pathways)  
- [F-10 Layer-2 submarine swap unlocks.](#f-10-layer-2-submarine-swap-unlocks)  
- [F-11 Machine-learning model marketplaces.](#f-11-machine-learning-model-marketplaces)  
- [F-12 Hardware bounty programs.](#f-12-hardware-bounty-programs)  
- [F-13 Open grant funding initiatives.](#f-13-open-grant-funding-initiatives)  
- [F-14 Inter-planetary data escrow.](#f-14-inter-planetary-data-escrow)  
- [F-15 Decentralised search over SEAL indexes.](#f-15-decentralised-search-over-seal-indexes)  
- [F-16 Adaptive fee markets & unlock auctions.](#f-16-adaptive-fee-markets--unlock-auctions)  
- [F-17 Programmable unlock rates via covenants.](#f-17-programmable-unlock-rates-via-covenants)  
- [F-18 Social-recovery vault frameworks.](#f-18-social-recovery-vault-frameworks)  
- [F-19 AI-assisted PoA monitoring agents.](#f-19-ai-assisted-poa-monitoring-agents)  
- [F-20 Unanswered big-picture research agendas.](#f-20-unanswered-big-picture-research-agendas)

---

---

## Basic QAs
The fundamentals: terminology, on-chain mechanics, cryptography flows, day-to-day usage, and everything a first-time reader is likely to wonder.  

### 1. What is LOCK in one sentence?  
LOCK is a stateless, server-less protocol that lets anyone encrypt a secret (the “SEAL”), cryptographically bind that ciphertext to a Bitcoin transaction, and guarantee that only a subsequent on-chain action satisfying preset rules can unlock it—eliminating accounts, passwords, and third-party servers.  

### 2. Why does the protocol call the encrypted file a **SEAL**?  
The word “seal” evokes a wax seal on a letter: tamper evidence and privacy in one primitive. In LOCK, a SEAL is a byte blob containing the ciphertext, encrypted metadata, and a short plaintext header. Breaking the seal (decrypting) is impossible until the unlock rules—also hidden inside—are satisfied by a qualifying Bitcoin spend.  

### 3. How does **sealing** actually happen step-by-step?  
1. A user selects a plaintext payload (file, JSON, license key, API token).  
2. They choose unlock criteria: authorised wallet, minimum amount, earliest block-height, optional unlock-limit, allowed recipients, minimum fee-rate, etc.  
3. The client generates a fresh 96-bit IV and a random ECDH key-pair or reuses an existing one.  
4. It performs ECDH with the intended unlocker’s public key, feeds the shared secret plus the SEAL hash into HKDF, and derives a 256-bit symmetric key.  
5. Using that key and the IV, it encrypts the payload under AES-256-GCM (or ChaCha20-Poly1305 in future).  
6. Encrypted metadata is appended, the plaintext header is finalised, and the SHA-256 hash of the entire blob becomes the vault ID.  

### 4. Does sealing cost anything on-chain?  
No. Sealing is an entirely offline operation. The ciphertext can be generated on an air-gapped laptop, burned to a CD, or printed as a QR code. No Bitcoin fee is paid until someone attempts to unlock.  

### 5. What is **binding** and why is it necessary?  
Binding is the act of “stapling” the vault to Bitcoin’s proof-of-work. A transaction that meets the metadata rules—e.g., spends from Alice’s P2WPKH address and pays at least 100 000 sats to Bob—must be signed, broadcast, and confirmed. Once the transaction is non-replaceable, the vault is considered bound and ready for unsealing.  

### 6. Is the binding transaction ID included in the key derivation?  
Deliberately, no. The key is derived only from the ECDH shared secret and the immutable SEAL hash. This choice protects against Replace-By-Fee (RBF) and other malleability vectors that would alter a txid after the fact.  

### 7. What is **Proof-of-Access (PoA)** in plain language?  
PoA is a client-side checklist: “Here is a transaction; does it satisfy the encrypted rules?” The checklist verifies spender script, amount/fee conditions, recipient addresses, block confirmation depth, signature validity, and any time-lock constraints. If the answer to every sub-check is “yes,” the client recomputes the symmetric key and tries to decrypt. A single bit flip in any critical field causes decryption to fail with an authentication error.  

### 8. What makes PoA different from Bitcoin Script?  
Bitcoin Script enforces conditions **inside** a transaction, at consensus level, and is limited to signature checks and simple arithmetic. PoA lives **outside** consensus: it can reference fee rate, external oracles, unlock counters, or whitelisted wallets without polluting the blockchain with custom opcodes. It is as expressive as off-chain code allows, yet fully verifiable by any observer.  

### 9. What is the role of **HKDF** in key derivation?  
ECDH yields a raw 32-byte secret. HKDF (HMAC-based Key Derivation Function) stretches and context-binds that secret into a longer key material. LOCK feeds the SEAL hash into both the `salt` and the `info` parameters so that the resulting 256-bit key is unique to that specific vault and uncorrelated with other uses of the same ECDH pair.  

### 10. Why does the protocol default to **AES-256-GCM** but mention ChaCha20-Poly1305?  
AES-GCM enjoys hardware acceleration (AES-NI) on x86 and ARM, making encryption near-free on most desktops and servers. However, many low-power chips lack AES-NI. ChaCha20-Poly1305 offers comparable security with superior constant-time performance in pure software. The spec therefore defines a cipher suite flag so clients can negotiate the algorithm while remaining interoperable.  

### 11. Explain **AEAD** in one paragraph.  
Authenticated Encryption with Associated Data binds confidentiality and integrity in a single construction. You input a key, a nonce, the plaintext, and optional “associated data” that remains cleartext but must not be tampered with. The cipher returns ciphertext and an authentication tag. On decryption, any change to either ciphertext or associated data causes tag verification to fail, ensuring that altered payloads never reveal partial plaintext.  

### 12. What is a **PSBT** and why does LOCK rely on it?  
A Partially Signed Bitcoin Transaction (BIP-174) is a structured file that separates deterministic fields (inputs, outputs, amounts, scripts) from non-deterministic fields (signatures, redeem scripts). It allows different devices—fee estimator, hardware wallet, mobile cosigner—to add their data in turn without overwriting each other. LOCK implements PSBT flows so that the vault creator can prepare a template, pass it to an offline signer, then to a fee-bumping service, and finally to the broadcaster.  

### 13. Can vaults demand **multisig** authorisation?  
Yes. The metadata merely points to an output script. That script can embed a 2-of-3 multisig in SegWit, a Taproot tree of spending paths, or even an nLockTime-guarded covenant spending condition. PoA only checks that the final transaction is valid under Bitcoin consensus and that it matches the one authorised script hash.  

### 14. How does an **unlock limit** work?  
Metadata may include `unlock_limit: 5`. After each successful PoA, the client appends the txid to a local (or shared) counter. Once five unique txids are recorded, attempts to unlock again are refused. Because the counter is off-chain, dishonest actors could ignore it; for critical metering, the sealer should encrypt five **different** secrets, each requiring a fresh transaction.  

### 15. Is it possible to have a **time-locked** vault?  
Absolutely. Include `earliest_block: 850 000` or `earliest_timestamp: 1780000000` in metadata. PoA will refuse transactions mined before that height or timestamp. Using absolute block heights is safer than timestamps because the latter are miner-editable.  

### 16. Who stores the **SEAL** and where?  
The protocol does not care. A SEAL can live on IPFS with a CID, in S3 with a signed URL, on Arweave for immutability, or be emailed as an attachment. The only requirement is that the unlocker can fetch **exactly** the original bytes; otherwise decryption fails.  

### 17. Can metadata be partially **public**?  
Yes, but this is discouraged. Any cleartext hint may leak pricing strategy, user identity, or product segmentation. If partial transparency is desired—e.g., “price = 100 000 sats” so wallets can autofill—a good practice is to store *only* that numeric field in the header while keeping everything else encrypted.  

### 18. Does LOCK depend on any **smart-contract** extensions like Taproot ASMs?  
No. LOCK is strictly consensus-agnostic. It requires nothing more than the ability to watch validated transactions and compute common Bitcoin libraries (e.g., secp256k1, BIP-32).  

### 19. What does a **change output** do in this context?  
If a wallet’s selected UTXO is larger than the required payment plus fee, the difference is returned to a *change* address controlled by the spender. PoA ignores change outputs entirely as long as the required recipient and amount are present.  

### 20. Is there a **minimum fee** baked into the protocol?  
The spec suggests enforcing a metadata option `min_feerate` so that low-fee spam doesn’t clog mempools and delay unlocks. Absent that field, any fee the network accepts is valid, but most user interfaces default to a reasonable sat/vB floor.  

### 21. Can unlockers pay **more** than the required amount?  
Yes, as long as the metadata condition uses a range operator (e.g., “≥ 100 000 sats”). Fixed-price vaults set the operator to “==”. The trade-off is user friction: an exact match simplifies wallet UI; ranges accommodate fee wiggle-room.  

### 22. How do **hardware wallets** integrate?  
Because PSBT is standard, devices like Ledger, Trezor, Coldcard, and SeedSigner can sign the prepared transaction without firmware changes. Advanced integrations might let firmware read a vault ID from QR and display “You are unlocking vault #E3F2… by paying 100 000 sats to addrX.”  

### 23. Does LOCK expose private keys to any server?  
Never. All key derivation occurs locally. The only secret crossing device boundaries is the *derived symmetric key* embedded in ciphertext, and even that is encrypted with itself via AEAD tags.  

### 24. Can a SEAL include multiple **files**?  
Yes. The payload is arbitrary bytes. You may tarball a directory, embed a zip archive, or store a JSON manifest plus binaries. Only payload size affects performance.  

### 25. How big can a SEAL be?  
The spec imposes no hard limit, but practical limits come from hosting costs and client memory. For multi-gigabyte blobs, implement streaming decryption and chunked uploads.  

---

## Product QAs
Implementation ideas, business models, and real-world workflows illustrating how the protocol can underpin actual products.

### 26. What is the most minimal **proof-of-concept** product?  
A single-page web app where creators drag-and-drop a file, enter a price, and click **Seal**. The app writes the SEAL to IPFS, returns a public CID plus a Lightning “fallback” invoice for those who prefer LN. Consumers click the link, see the price, pay the on-chain transaction, and the page auto-refreshes when PoA passes, revealing a download button. No user accounts, no database—just client-side JavaScript and an IPFS gateway.  

### 27. How could a **media outlet** use LOCK for pay-per-article access?  
Each premium article is exported as a self-contained HTML file or PDF, then sealed with a rule “≥ 5000 sats to outlet-treasury address.” Readers’ browsers run a lightweight WebAssembly PoA module; upon detection of an eligible transaction, the encrypted article decrypts in-place. The outlet never stores passwords or card data, and the reader gains a permanent proof of purchase on-chain.  

### 28. Describe a **software licence** vending flow.  
1. Vendor encrypts a licence key in a SEAL.  
2. Metadata demands payment ≥ 0.002 BTC to a multisig treasury address.  
3. Customer pays; PoA passes; client extracts the key.  
4. Client library sends the txid and licence hash to the vendor’s API.  
5. Vendor checks mempool, records account as “paid,” and issues automatic updates.  

### 29. Can LOCK support **subscription** models?  
Indirectly. The creator reseals content monthly with a new SEAL ID and unlock rules. Subscribers repeat the on-chain payment. Alternatively, Lightning can handle recurring micro-payments, and LOCK is reserved for initial activation or large quarterly bundles that need future-proof auditability.  

### 30. What is a **dead-man’s switch** product powered by LOCK?  
A whistle-blower encrypts incriminating documents. Unlock rules: “Anyone may pay at least 0.05 BTC *after* block 900 000.” They publish the SEAL CID publicly. As long as the whistle-blower keeps resetting the earliest block in a hypothetical “Re-seal” feature, the secret stays locked. If they die or are silenced, activists can unlock by paying the fee, triggering automatic publication.  

### 31. Outline a **ticketing** implementation for events.  
Each seat has a unique QR code embedded in a SEAL. Unlock conditions: “Pay exactly 100 000 sats to stadium-multisig within time window T.” Once a spectator pays, PoA reveals the seat’s QR, which is scanned at entry. No scalpers can double-sell because the spending transaction is single-use and publicly verifiable.  

### 32. Could LOCK facilitate **royalty splits**?  
Yes. Metadata can declare multiple mandatory outputs: 60 % to artist, 30 % to producer, 10 % to developer. PoA insists the unlocking transaction satisfy this output map. Wallets implementing BIP-47 reusable payment codes or PayJoin can automate the split, ensuring fair revenue distribution at protocol level.  

### 33. How would a **SaaS API pay-as-you-go** model work?  
Encrypt a JSON token granting, say, 10 000 API calls. Price: 15 000 sats. Each time the token nears exhaustion, the SaaS dashboard offers a new SEAL link for another bundle. Because the unlock transaction is on-chain, the vendor never risks chargeback fraud and can see at a glance how many tokens are outstanding.  

### 34. Is there a zero-backend **progressive web app** approach?  
Yes. Ship the entire sealing and unsealing logic in the browser with in-memory storage. For hosting, pin SEALs to public IPFS, and let clients directly query electrum servers or public Esplora APIs for transaction data. The only backend you might optional run is a mempool websocket relay, but even that can be replaced by open infrastructure.  

### 35. Can LOCK coexist with **Lightning**?  
Certainly. Lightning excels at instant micro-payments and streaming content. A hybrid model might use LN for real-time access (e.g., per-second video streaming) and LOCK for “buy-to-own” downloads or large unlocks that need an immutable record. Both flows deposit revenue to the same treasury wallet.  

### 36. What are the UX **pain points** for mainstream users?  
- Crafting on-chain transactions without exposing them to timing risks.  
- Understanding why an unlock failed (wrong amount, unconfirmed, fee too low).  
- Waiting for confirmations when block space is congested.  
- Handling mulltiple wallets or hardware signers in multi-device workflows.  

### 37. How can wallets improve the **signing experience**?  
Wallet firmware can read the PSBT, detect a `proprietary:lock:seal_id` field, and display: “This payment unlocks ‘premium-guide-2025.pdf’ for 0.0001 BTC.” Clear prompts reduce phishing risk and aid adoption.  

### 38. Is there a **marketplace** potential?  
Yes. A “LOCK Hub” akin to npm or Docker Hub could host SEALs, display price-tags, version numbers, and seller reputation. Buyers would filter by category and pay directly from the browser. The hub never touches keys, merely lists metadata and CIDs.  

### 39. What does a **compliance dashboard** look like for creators?  
A web console shows: SEAL ID, total unlocks, cumulative revenue, top spender addresses, average fee, and geographic heat-map (via IP lookup on download requests). Because on-chain data is public, the dashboard can compute revenue trustlessly.  

### 40. Can a creator provide **refunds**?  
Technically yes: they can whip up a PSBT returning sats to the spender’s address. However, refunds defeat the irreversible nature of Proof-of-Work. Most businesses would instead reseal a second secret labelled “refund voucher” and unlock it to the aggrieved user for free.  

### 41. What **open-source licences** best fit LOCK-gated software?  
Dual licences. Offer GPL-3 for non-commercial users unlocked trivially (or given away), and a commercial licence sealed behind a 0.01 BTC paywall. The on-chain proof acts as purchase evidence.  

### 42. Describe a **charity pay-to-reveal** campaign.  
An NGO seals a high-resolution report detailing illegal deforestation evidence. Unlock condition: “When cumulative donations to address X reach 5 BTC, the report decrypts automatically.” Donors collectively fund the target; the final transaction pushes the total over the threshold, PoA passes, the secret becomes public.  

### 43. How might a **content bundle** sale work during a holiday?  
Black-Friday.zip is sealed at 50 % discount. Metadata sets an `expiry_block` after which PoA will fail. Shoppers rush to purchase before the deadline. The system self-sunsets without the seller coordinating time-zones or payment processors.  

### 44. What’s an **education** use-case?  
A professor locks lecture slides; students pay a small fee, and each txid doubles as attendance proof. Automatic CSV export of addresses can feed into a grading spreadsheet.  

### 45. Could an author **pre-sell** a book via LOCK?  
Yes. Seal the manuscript; require a payment plus an OP_RETURN that encodes the buyer’s e-mail hash. When the threshold of 1000 unlocks is reached, the author knows the book is profitable enough to print physical copies.  

---

## Security QAs
Deep-dive into attack surfaces, cryptographic nuances, operational hazards, and mitigation strategies.

### 46. What happens if the **IV** is reused?  
AES-GCM with a repeated IV under the same key destroys confidentiality and authentication. Attackers can compute XOR of plaintexts. Clients must use a cryptographically secure random number generator and include self-tests that detect IV collisions during CI.  

### 47. How does the protocol handle **Replace-By-Fee** attacks?  
By ignoring `txid` and checking the complete transaction structure post-confirmation. If any field (input index, sequence) is mutated, consensus will still consider it the same spend; PoA only cares that amount, recipients, and spender script match.  

### 48. Could an attacker perform a **replay attack** across vaults?  
Not if the SEAL hash is placed into both the `salt` and `info` fields of HKDF. The derived key is unique per vault. Replaying the same transaction on another vault results in a key mismatch and authentication failure.  

### 49. Is the protocol vulnerable to **side-channel leaks** like ciphertext length?  
Payload size is visible. If you encrypt “Yes” vs “No,” lengths differ. To mitigate, pad ciphertexts to rounded kilobyte blocks or use deterministically sized containers (e.g., always 256 KiB).  

### 50. What about **metadata leakage**?  
If teams leave `price` or `receiver` unencrypted, adversaries can front-run payments or learn private valuations. The spec urges *encrypt-by-default*, forcing explicit CLI flags to mark a field public.  

### 51. How to deal with **chain re-orgs**?  
Set a client default of 6 confirmations before PoA passes. For high-value vaults, wait 12 or more. Additionally, store the block hash at which PoA succeeded; if a re-org occurs and the tx disappears, mark the unlock invalid and re-lock the UI.  

### 52. Could miners **censor** high-value unlocks for ransom?  
In theory. Attackers might hold a vault hostage by censoring transactions to the required address. Mitigations: allow “anyone can pay” rules (any input allowed), randomised recipient sets, or cross-chain PoA fallback (future work). Economics also discourage blanket censorship: miners lose fees to competitors.  

### 53. Are there **quantum** concerns?  
ECDH on secp256k1 is vulnerable to Shor’s algorithm. If quantum computers ever reach that scale, swap ECDH for ML-KEM (Kyber) and embed PQ signatures in Taproot leaf scripts. Because SEAL files carry their cipher suite in the header, migrations can be phased in.  

### 54. What is a **fee sniping** vector and how to prevent it?  
Fee sniping: an attacker observes your low-feerate payment and broadcasts a higher-feerate double-spend to jump the mempool queue, potentially revealing your secret while canceling your intended payment. Solution: require a minimum feerate, or monitor mempool for RBFs and auto-bump via CPFP.  

### 55. How does the spec avoid **insecure random** generation?  
Reference implementations use `getrandom()` or `/dev/urandom` on POSIX and `BCryptGenRandom` on Windows. Unit tests verify nonce uniqueness across 1 million iterations. Security auditors should fuzz test for entropy exhaustion scenarios.  

### 56. Could a malicious host serve a **corrupted SEAL**?  
Yes. Always hash the downloaded blob and compare to the advertised vault ID before attempting PoA. CLI tools refuse to parse mismatching files and display a red warning.  

### 57. What about **DoS** vectors on public gateways?  
Attackers could spam gigantic bogus SEALs to congest IPFS pins. Gateways should enforce file-size quotas, rate-limit uploads, and require small staking fees (e.g., via Lightning) to deter abuse.  

### 58. Is there a **key compromise** escalation path?  
If a sealer’s private key is leaked, adversaries can create *new* vaults masquerading as the original identity, but cannot decrypt already sealed files because the symmetric keys are unique per unlocker. Developers should rotate ECDH keys periodically and track fingerprint changes.  

### 59. How to secure **unlock counters**?  
Store counters in an append-only log like a Merkle tree posted periodically to Arweave. Clients compare local counters and can refuse decryption if a remote discrepancy exceeds a threshold.  

### 60. Does LOCK introduce new **privacy leaks** on-chain?  
Not by default. Unlock transactions look like standard spends. If you embed a vault ID in OP_RETURN for marketing metrics, you willingly sacrifice some privacy. Keep optional data minimal or hashed.  

### 61. Can malicious wallets create **dust fallout**?  
Yes, by adding tiny outputs to the unlocking transaction. PoA ignores extra outputs but wallet UIs should warn if the number of outputs exceeds metadata expectations.  

### 62. What if the **recipient address** is compromised?  
The sealer can specify multiple fallback addresses and require that at least one appears in the transaction. If the primary address is blacklisted, users can still pay the secondary one.  

### 63. Are **hash collisions** a threat for SEAL IDs?  
SHA-256 collisions are currently infeasible. Even if a collision existed, the attacker would need to craft a second meaningful ciphertext that decrypts with the same key yet contains useful plaintext—extremely unlikely given randomised IVs.  

### 64. Is there any risk of **timing side-channels** in decryption?  
All reference libraries force constant-time tag verification. Developers using high-level crypto APIs (e.g., WebCrypto) must ensure the underlying implementation resists early-exit timing leaks.  

### 65. Who audits **client compliance**?  
The spec encourages third-party auditors to publish test vectors and compliance badges. Wallets that pass the suite can advertise “LOCK-Ready.” Continuous integration pipelines run the suite on every commit.  

---

## Pragmatic QAs
Broader considerations—economics, ethics, network effects, and the project’s place in Bitcoin’s evolving landscape.

### 66. Why anchor access to **energy expenditure** instead of identity?  
Energy is objective, unforgeable, and politically neutral. Identity systems embed jurisdiction, regulation, and censorship. By tying decryption to a burned fee or real spend, LOCK ensures that the gatekeeper is physics, not paperwork.  

### 67. Does this re-create **DRM**?  
It depends. A musician selling an album under LOCK is similar to DRM. A whistle-blower time-locking leaks or an NGO fundraising with pay-to-reveal isn’t DRM but a public-good incentive scheme. The protocol is content-agnostic; ethics rest on the use-case.  

### 68. How does LOCK compare with **Lightning paywalls**?  
Lightning offers instant, cheap, reversible payments but poor auditability (HTLCs are pruned). LOCK offers slower, fee-heavy, but *permanent* proofs. For content needing archival integrity (e-books, academic papers, on-chain royalties), LOCK is superior. Many products will combine both.  

### 69. Could governments **ban** LOCK-gated content?  
They can block IPFS gateways or pressure hosting providers. However, because SEALs are content-addressed, users can share them over e-mail, BitTorrent, sneakernet. The only choke point is the Bitcoin network, whose censorship resistance is well-documented.  

### 70. Will this incentivise **spam transactions**?  
Possibly during hype cycles. Yet each unlock pays real fees, so the market self-regulates. When block space is scarce, only high-value unlocks make economic sense. Low-value use-cases can migrate to Lightning or Liquid sidechains.  

### 71. Does LOCK threaten **permissionless culture** by pay-walling knowledge?  
It could, but it also empowers independent creators deprived of monetisation avenues. The protocol is like paper: can print a manifesto or a porn mag. Governance must come from social norms, not code restrictions.  

### 72. How might LOCK bolster **Bitcoin circular economies**?  
By giving creators a direct way to accept Bitcoin without custodians, users acquire sats to purchase content, and earned sats recirculate. The more digital commerce occurs natively in Bitcoin, the smaller the reliance on fiat on-ramps.  

### 73. Is there a risk of **consolidation** into closed marketplaces?  
Yes. Centralised portals could dominate distribution through better UX and marketing budgets. Mitigation: keep SEAL format open, push federated indexes, and encourage p2p search tools.  

### 74. What is the **environmental** footprint?  
Unlocks are ordinary transactions; Bitcoin’s energy usage doesn’t change materially. Compared with energy-hungry DRM servers or data-center-heavy streaming, a one-time unlock could be greener, especially if block space is shared with other economic activity.  

### 75. Could LOCK undermine **open-source** culture?  
Pay-gating source code conflicts with free software values. Yet dual-licensing or donationware can coexist. The protocol provides choice; communities decide norms.  

### 76. Will miners capture **MEV** from high-value unlocks?  
A miner noticing a 1 BTC pay-to-unlock might front-run by broadcasting the transaction themselves, decrypting the secret first. If metadata restricts spender script to the original buyer, this risk vanishes. Designers must weigh openness versus MEV risk in rule selection.  

### 77. Does LOCK require a **token**?  
No. Bitcoin is the only settlement medium. No governance token or sidechain asset dilutes security.  

### 78. How does LOCK align with the ethos of **self-custody**?  
It extends self-custody from money to data. Owning the private key becomes the master credential for both wealth and knowledge.  

### 79. Could LOCK facilitate **dark markets**?  
Any censorship-resistant tool can be abused. Digital weapons manuals or stolen databases might be sold. Society must rely on law enforcement targeting endpoints, not break the protocol itself.  

### 80. Where is the line between **privacy** and transparency?  
LOCK unlocks are transparent spends; anyone can see you paid for *something*, but not *what*. If OP_RETURN embeds a vault ID, linkage grows. Users choose trade-offs by deciding which metadata stays encrypted.  

### 81. Is LOCK a step toward **“Internet 1995, but with money built-in”**?  
Possibly. In the early web, static files were free; commerce layers came later. LOCK inverts the model: every file can have native Bitcoin gating from birth, enabling new micro-entrepreneurship patterns.  

---

## Future QAs
Speculative research directions, roadmap milestones, and open questions for the community.

### 82. What is the path to **formal verification**?  
Translate the PoA state machine into TLA+ or Coq. Prove safety (if PoA passes, rules were satisfied) and liveness (if rules are satisfied, PoA eventually passes). Generate executable test cases from proofs and integrate into CI for all client libraries.  

### 83. Will we see **Taproot commitments**?  
Future versions might embed a vault ID in a Taproot leaf, making the unlock spend provably linked to a vault without OP_RETURN bloat. This could enable “pay-to-vault” donations where the secret remains unknown until path reveal.  

### 84. Can LOCK support **oracle-based** conditions?  
Yes. Use adaptor signatures or discrete-log contracts: metadata says “unlock if BTC/USD > $100 k.” A trusted oracle posts a signature that completes the transaction only when the price trigger fires. The vault key derives from the completed signature.  

### 85. What about **post-quantum** key derivation?  
Swap ECDH for ML-KEM. HKDF remains, but salts increase in size. Cipher suite flags in the header allow backward compatibility: old clients skip vaults with unknown PQ suites.  

### 86. Is **cross-chain PoA** viable?  
An Ethereum or Solana user might wish to unlock by burning their token. Bridging would require SPV proofs or zk-SNARKs verifying the foreign chain’s transaction inside a Bitcoin sidecar. Research is ongoing.  

### 87. Can we create **zero-knowledge unlock proofs**?  
Use zk-SNARKs to prove knowledge of a Bitcoin transaction that meets metadata without revealing which one. The SNARK proof replaces raw txid in PoA. This enables anonymous pay-to-unlock where chain surveillance cannot link payment to content.  

### 88. What’s next for **reference implementations**?  
- TypeScript library for browsers and Node.  
- Rust crate optimised for server-side bulk PoA.  
- Python client for data scientists.  
- Go micro-service for embedding in clusters.  

### 89. Should there be a **governance foundation**?  
A non-profit could steward the spec, run interoperability hackathons, and fund audits. Membership via annual donations, no token.  

### 90. Could LOCK integrate with **Nostr**?  
Yes. Post SEAL hashes and metadata as Nostr events. Subscribers listen for vault offers and pay directly. Decryption happens in the Nostr client. This merges social discovery with instant pay-to-unlock.  

### 91. What about **Layer-2** unlocks on Lightning?  
A submarine swap from Lightning to on-chain could trigger an automatic unlock once the swap completes, blending Lightning speed with on-chain auditability. 

### 92. Will machine learning models be **sealed**?  
Large language models are multi-gigabyte binaries. Sealing them forces buyers to prove on-chain commitment before download, combating piracy in the AI model marketplace.  

### 93. Can LOCK be used for **IoT firmware** distribution?  
Yes. Manufacturers seal firmware images; devices with embedded Bitcoin SPV clients verify PoA before flashing. Rogue servers can’t push malicious updates because they lack a valid spend.  

### 94. Could there be **grant funding** for open-source tooling?  
Yes. Bitcoin-focused grants from HRF, Spiral, or OpenSats could bankroll reference wallets, audit work, and educational material to accelerate adoption.  

### 95. What’s the biggest **unknown**?  
Human factors: will users tolerate on-chain fees and confirmation waits? UX research and wallet integrations will determine widespread adoption.  

---

## Final Thoughts  
LOCK is best understood not as a product but as a **primitive**—like public-key cryptography or hash functions. It turns Bitcoin’s thermodynamic finality into a programmable access layer. From micro-paywalled journalism to multi-sig enterprise secrets, from whistle-blower dead-man’s switches to Taproot-embedded royalty splits, the design space stretches wide. This document captured the most pressing questions—obvious, obscure, philosophical, and forward-looking—to help builders reason about that space. If you have a question not answered here, open an issue or start a discussion; every hard question we ask now prevents a critical oversight later.  
