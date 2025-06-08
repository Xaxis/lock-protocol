## Lock × OrangeCheck QAs  
> Synergies, distinctions, and real-world product patterns for combining a secrecy primitive (Lock) with a stake-weighted identity primitive (OrangeCheck).  

### What is the single biggest primitive both protocols share?  
Both hinge on **Bitcoin-native attestations** that can be verified with nothing more than a full node RPC call—`gettxout` for an unspent UTXO (Lock’s unlock or OrangeCheck’s stake) or, in OrangeCheck’s Lightning path, a simple HTLC probe.  

### How do Lock and OrangeCheck each treat *time* in their security models?  
Lock encodes time as *unlock conditions* (e.g., earliest block-height), whereas OrangeCheck exposes time as *uptime* of the bond (blocks held or blocks until HTLC expiry). One guards **when decryption is possible**; the other measures **how long a handle has stayed honest**.  

### Do either protocols require new opcodes or soft forks?  
No. Both stay 100 % within today’s consensus rules—Lock uses existing script templates and PSBT, OrangeCheck stays inside Taproot key-path or Lightning HOLD HTLCs.  

### How do they differ in on-chain cost?  
Lock pays once **per unlock attempt** (the binding spend), whereas OrangeCheck pays once **per identity** (dust-level Taproot output *or* no bytes at all if using a Lightning HOLD).  

### Which cryptographic secret does each protocol reveal upon success?  
Lock reveals the **plaintext and metadata** guarded by the SEAL. OrangeCheck reveals **nothing**—the stake merely proves continuous custody; spending it revokes the badge rather than exposing hidden data.  

### Can the same Taproot output serve both protocols simultaneously?  
Yes. A single Taproot output can:  
1. Hold ciphertext hash in an OP_RETURN for Lock’s binding proof.  
2. Double as OrangeCheck’s stake anchor if its internal key signs the identity claim.  
One coin → two independent verifications.  

### What is the trust model overlap for off-chain variants?  
Lock’s off-chain operations (sealing, PoA checking) rely on deterministic client code; OrangeCheck’s off-chain Lightning variant relies on the honesty of the routing node to keep an HTLC pending. Both still resolve to Bitcoin L1 if disputes arise.  

### How does *revocation* semantics differ?  
*Lock*—a vault never revokes; once ciphertext is decrypted, knowledge is out forever.  
*OrangeCheck*—revocation is deliberate: spend/settle the bond and the badge evaporates instantly across every verifier.  

### Can OrangeCheck act as an *authentication* layer for Lock vaults?  
Absolutely. A front-end can demand a live OrangeCheck badge before accepting a Lock SEAL or serving a decrypting key—removing spam requests without traditional login.  

### Does Lock care about the *value* of the stake coin?  
No; any amount that satisfies the unlock script is fine. OrangeCheck, by contrast, uses stake value (and age) as a Sybil-resistance weight.  

### How would a developer bundle both in a single wallet UX?  
Present two tabs: **“Secrets”** (Lock) and **“Identity”** (OrangeCheck). Funding a Taproot address automatically:  
* saves its txid:vout into the Lock vault header (for future PoA), and  
* offers to sign an OrangeCheck claim with the same internal key.  

### Can OrangeCheck protect *file-drop* inboxes built with Lock?  
Yes. Require uploaders to attach a valid badge; slash the stake if malware or spam is detected. The inbox accepts content (Lock) only from economically weighted senders (OrangeCheck).  

### How do the protocols complement each other in *pseudo-anonymous SaaS*?  
OrangeCheck grants password-less sign-in and pay-to-spam protection; Lock stores usage tokens or API keys that only the paying customer can decrypt after billing events settle—in one architecture the same Bitcoin transaction both tops up balance (stake) and finalises usage rights (unlock).  

### What happens during a chain re-org?  
For Lock: PoA temporarily fails until the binding spend reconfirms.  
For OrangeCheck: `gettxout` returns null → badge reads “revoked” until the stake reconfirms. Both automatically heal after a re-cemented block.  

### Do the two schemes amplify or dilute privacy when combined?  
Amplify, if used carefully: Lock hides payload; OrangeCheck avoids personal data. Using CoinJoin funding plus blinded Lightning paths yields a system where neither identity nor secret provenance is traceable, yet spam is still costly.  

### Product pattern #1 — **Encrypted Whistle-blower Platform**  
Lock encrypts the submission; only the newsroom’s spend to a charity address unlocks the file if the story goes live.  
OrangeCheck requires whistle-blowers to post a minimal stake (HTLC) so trolls must lock sats to flood the tip-line, yet journalists can’t deanonymise the source.  

### Product pattern #2 — **Stake-gated Data Marketplace**  
Sellers publish datasets as Lock SEALs.  
Buyers must hold an OrangeCheck badge of ≥ 0.01 BTC for marketplace access; the same stake key signs purchase orders.  

### Product pattern #3 — **Custody-free Subscription App**  
Monthly fee is a recurring Lightning HOLD HTLC that doubles as OrangeCheck badge uptime.  
After each payment cycle, the service issues a Lock-sealed API token that only the still-funded key can decrypt.  

### Product pattern #4 — **Quadratic DAO with Confidential Proposals**  
OrangeCheck weight = √(stake × days_alive) → voting power.  
Proposals are Lock-sealed until voting closes, preventing premature leaks.  

### Product pattern #5 — **Self-custodial Password Vault**  
Each password blob is a Lock SEAL.  
Unlocking from a new device demands a live OrangeCheck signature, removing e-mail resets entirely.  

### Product pattern #6 — **Pay-to-View Research Library**  
Lock stores academic papers as SEALs; each unlock spend routes an on-chain royalty to the author.  
OrangeCheck badges above a sat threshold grant reading privileges and throttle downloads by stake weight.  

### Product pattern #7 — **Sealed-Bid Auction Room**  
Every bid is Lock-encrypted until the reveal block, eliminating early price signalling.  
A bidder’s OrangeCheck stake acts as a refundable bid bond and Sybil filter; spending the bond reveals the bid.  

### Product pattern #8 — **Anti-Sybil Token Airdrop Portal**  
Airdrop claim codes are distributed as public Lock SEALs.  
Only wallets with a live OrangeCheck badge ≥ T sats can decrypt, blocking bot swarms from farming tokens.  

### Product pattern #9 — **Portable Medical Record Handoff**  
Hospitals seal patient records with Lock; decryption occurs only when the patient or prior provider spends an authorised tx.  
Receiving clinics must present a high-value OrangeCheck badge, demonstrating licensed custody before access.  

### Product pattern #10 — **Confidential Deal Room**  
Draft contracts and cap-tables are Lock-sealed in a shared vault.  
Participants gain entry by posting mutually agreed OrangeCheck stakes; badge revocation doubles as automatic NDA penalty.  

### Product pattern #11 — **Freelance Gig Escrow**  
Job specs and deliverables stay Lock-encrypted until payment UTXO confirms.  
Both client and freelancer maintain OrangeCheck badges—collateral for timely delivery and payment, deterring rug-pulls.  

### Product pattern #12 — **DRM-less Film Distribution**  
Feature films are Lock-sealed; each purchase unlocks a unique local copy without third-party DRM servers.  
Subscriber badge uptime proves ongoing entitlement; revoking stake halts access to future releases.  

### Product pattern #13 — **Stake-Metered API Gateway**  
Per-session API tokens are Lock-sealed and redeemed via spend-to-unlock.  
Rate limits scale with OrangeCheck stake weight, letting developers prepay capacity without account paperwork.  

### Product pattern #14 — **Ticketless Event Entry**  
Gate QR codes remain Lock-sealed until the block height of doors-open.  
Attendees prove stake via OrangeCheck; their refundable deposit discourages no-shows and scalping.  

### Product pattern #15 — **Stake-Guarded IoT Firmware Updates**  
Firmware images are Lock-sealed; devices broadcast an unlock spend to self-update.  
Manufacturers sign updates with a high-value OrangeCheck badge—stake slashing deters malware.  

### Product pattern #16 — **P2P Micro-Loan Platform**  
Loan agreements and repayment schedules stay Lock-encrypted until the borrower broadcasts repayment.  
Borrower badges serve as staked collateral and an on-chain credit score via badge uptime.  

### Product pattern #17 — **Cloud Backup with Recovery Council**  
Encryption keys are split and Lock-sealed to multiple guardians.  
Restoration requires N live OrangeCheck signatures; any misbehaving guardian risks stake revocation.  

### Product pattern #18 — **Election Audit Package**  
Ballot bundles are Lock-sealed until the official results block.  
Accredited auditors must hold sizeable OrangeCheck badges, pricing partisan spam off the network.  

### Product pattern #19 — **Cross-Border Payroll Receipts**  
Pay-stubs are Lock-sealed and reference the payroll transaction ID for proof.  
Employees’ OrangeCheck badges sign receipt requests; employer badges confirm solvency and timely payment.  

### Product pattern #20 — **Supply-Chain Compliance Vault**  
Testing certificates per shipment are Lock-sealed; customs unlock upon arrival spend.  
Shippers maintain high-value OrangeCheck badges; revocation flags non-compliant cargo automatically.  
