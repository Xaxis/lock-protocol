## Lock × OrangeCheck QAs  
> Synergies, distinctions, and real-world product patterns for combining a secrecy primitive (Lock) with a stake-weighted identity primitive (OrangeCheck).  

### 1. What is the single biggest primitive both protocols share?  
Both hinge on **Bitcoin-native attestations** that can be verified with nothing more than a full node RPC call—`gettxout` for an unspent UTXO (Lock’s unlock or OrangeCheck’s stake) or, in OrangeCheck’s Lightning path, a simple HTLC probe.  

### 2. How do Lock and OrangeCheck each treat *time* in their security models?  
Lock encodes time as *unlock conditions* (e.g., earliest block-height), whereas OrangeCheck exposes time as *uptime* of the bond (blocks held or blocks until HTLC expiry). One guards **when decryption is possible**; the other measures **how long a handle has stayed honest**.  

### 3. Do either protocols require new opcodes or soft forks?  
No. Both stay 100 % within today’s consensus rules—Lock uses existing script templates and PSBT, OrangeCheck stays inside Taproot key-path or Lightning HOLD HTLCs.  

### 4. How do they differ in on-chain cost?  
Lock pays once **per unlock attempt** (the binding spend), whereas OrangeCheck pays once **per identity** (dust-level Taproot output *or* no bytes at all if using a Lightning HOLD).  

### 5. Which cryptographic secret does each protocol reveal upon success?  
Lock reveals the **plaintext and metadata** guarded by the SEAL. OrangeCheck reveals **nothing**—the stake merely proves continuous custody; spending it revokes the badge rather than exposing hidden data.  

### 6. Can the same Taproot output serve both protocols simultaneously?  
Yes. A single Taproot output can:  
1. Hold ciphertext hash in an OP_RETURN for Lock’s binding proof.  
2. Double as OrangeCheck’s stake anchor if its internal key signs the identity claim.  
One coin → two independent verifications.  

### 7. What is the trust model overlap for off-chain variants?  
Lock’s off-chain operations (sealing, PoA checking) rely on deterministic client code; OrangeCheck’s off-chain Lightning variant relies on the honesty of the routing node to keep an HTLC pending. Both still resolve to Bitcoin L1 if disputes arise.  

### 8. How does *revocation* semantics differ?  
*Lock*—a vault never revokes; once ciphertext is decrypted, knowledge is out forever.  
*OrangeCheck*—revocation is deliberate: spend/settle the bond and the badge evaporates instantly across every verifier.  

### 9. Can OrangeCheck act as an *authentication* layer for Lock vaults?  
Absolutely. A front-end can demand a live OrangeCheck badge before accepting a Lock SEAL or serving a decrypting key—removing spam requests without traditional login.  

### 10. Does Lock care about the *value* of the stake coin?  
No; any amount that satisfies the unlock script is fine. OrangeCheck, by contrast, uses stake value (and age) as a Sybil-resistance weight.  

### 11. How would a developer bundle both in a single wallet UX?  
Present two tabs: **“Secrets”** (Lock) and **“Identity”** (OrangeCheck). Funding a Taproot address automatically:  
* saves its txid:vout into the Lock vault header (for future PoA), and  
* offers to sign an OrangeCheck claim with the same internal key.  

### 12. Can OrangeCheck protect *file-drop* inboxes built with Lock?  
Yes. Require uploaders to attach a valid badge; slash the stake if malware or spam is detected. The inbox accepts content (Lock) only from economically weighted senders (OrangeCheck).  

### 13. How do the protocols complement each other in *pseudo-anonymous SaaS*?  
OrangeCheck grants password-less sign-in and pay-to-spam protection; Lock stores usage tokens or API keys that only the paying customer can decrypt after billing events settle—in one architecture the same Bitcoin transaction both tops up balance (stake) and finalises usage rights (unlock).  

### 14. What happens during a chain re-org?  
For Lock: PoA temporarily fails until the binding spend reconfirms.  
For OrangeCheck: `gettxout` returns null → badge reads “revoked” until the stake reconfirms. Both automatically heal after a re-cemented block.  

### 15. Do the two schemes amplify or dilute privacy when combined?  
Amplify, if used carefully: Lock hides payload; OrangeCheck avoids personal data. Using CoinJoin funding plus blinded Lightning paths yields a system where neither identity nor secret provenance is traceable, yet spam is still costly.  

### 16. Product pattern #1 — *Encrypted Whistle-blower Platform*  
* **Lock** encrypts the submission; only the newsroom’s spend to a charity address unlocks the file if story goes live.  
* **OrangeCheck** requires whistle-blowers to post a minimal stake (HTLC) so trolls must lock sats to flood the tip-line, yet journalists can’t deanonymise the source.  

### 17. Product pattern #2 — *Stake-gated Data Marketplace*  
* Sellers publish datasets as Lock SEALs.  
* Buyers must hold an OrangeCheck badge of ≥ 0.01 BTC for marketplace access; the same stake key signs purchase orders.  

### 18. Product pattern #3 — *Custody-free Subscription App*  
* Monthly fee is a recurring Lightning HOLD HTLC that doubles as OrangeCheck badge uptime.  
* After each payment cycle, the service issues a Lock-sealed API token that only the still-funded key can decrypt.  

### 19. Product pattern #4 — *Quadratic DAO with Confidential Proposals*  
* OrangeCheck weight = √(stake × days_alive) → voting power.  
* Proposals are Lock-sealed until voting closes, preventing premature leaks.  

### 20. Product pattern #5 — *Self-custodial Password Vault*  
* Each password blob is a Lock SEAL.  
* Unlocking from a new device demands a live OrangeCheck signature, removing e-mail resets entirely.  
