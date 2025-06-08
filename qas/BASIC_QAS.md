## Basic QAs
> The fundamentals: terminology, on-chain mechanics, cryptography flows, day-to-day usage, and everything a first-time reader is likely to wonder.  

### What is LOCK in one sentence?  
LOCK is a stateless, server-less protocol that lets anyone encrypt a secret (the “SEAL”), cryptographically bind that ciphertext to a Bitcoin transaction, and guarantee that only a subsequent on-chain action satisfying preset rules can unlock it—eliminating accounts, passwords, and third-party servers.  

### Why does the protocol call the encrypted file a **SEAL**?  
The word “seal” evokes a wax seal on a letter: tamper evidence and privacy in one primitive. In LOCK, a SEAL is a byte blob containing the ciphertext, encrypted metadata, and a short plaintext header. Breaking the seal (decrypting) is impossible until the unlock rules—also hidden inside—are satisfied by a qualifying Bitcoin spend.  

### How does **sealing** actually happen step-by-step?  
1. A user selects a plaintext payload (file, JSON, license key, API token).  
2. They choose unlock criteria: authorised wallet, minimum amount, earliest block-height, optional unlock-limit, allowed recipients, minimum fee-rate, etc.  
3. The client generates a fresh 96-bit IV and a random ECDH key-pair or reuses an existing one.  
4. It performs ECDH with the intended unlocker’s public key, feeds the shared secret plus the SEAL hash into HKDF, and derives a 256-bit symmetric key.  
5. Using that key and the IV, it encrypts the payload under AES-256-GCM (or ChaCha20-Poly1305 in future).  
6. Encrypted metadata is appended, the plaintext header is finalised, and the SHA-256 hash of the entire blob becomes the vault ID.  

### Does sealing cost anything on-chain?  
No. Sealing is an entirely offline operation. The ciphertext can be generated on an air-gapped laptop, burned to a CD, or printed as a QR code. No Bitcoin fee is paid until someone attempts to unlock.  

### What is **binding** and why is it necessary?  
Binding is the act of “stapling” the vault to Bitcoin’s proof-of-work. A transaction that meets the metadata rules—e.g., spends from Alice’s P2WPKH address and pays at least 100 000 sats to Bob—must be signed, broadcast, and confirmed. Once the transaction is non-replaceable, the vault is considered bound and ready for unsealing.  

### Is the binding transaction ID included in the key derivation?  
Deliberately, no. The key is derived only from the ECDH shared secret and the immutable SEAL hash. This choice protects against Replace-By-Fee (RBF) and other malleability vectors that would alter a txid after the fact.  

### What is **Proof-of-Access (PoA)** in plain language?  
PoA is a client-side checklist: “Here is a transaction; does it satisfy the encrypted rules?” The checklist verifies spender script, amount/fee conditions, recipient addresses, block confirmation depth, signature validity, and any time-lock constraints. If the answer to every sub-check is “yes,” the client recomputes the symmetric key and tries to decrypt. A single bit flip in any critical field causes decryption to fail with an authentication error.  

### What makes PoA different from Bitcoin Script?  
Bitcoin Script enforces conditions **inside** a transaction, at consensus level, and is limited to signature checks and simple arithmetic. PoA lives **outside** consensus: it can reference fee rate, external oracles, unlock counters, or whitelisted wallets without polluting the blockchain with custom opcodes. It is as expressive as off-chain code allows, yet fully verifiable by any observer.  

### What is the role of **HKDF** in key derivation?  
ECDH yields a raw 32-byte secret. HKDF (HMAC-based Key Derivation Function) stretches and context-binds that secret into a longer key material. LOCK feeds the SEAL hash into both the `salt` and the `info` parameters so that the resulting 256-bit key is unique to that specific vault and uncorrelated with other uses of the same ECDH pair.  

### Why does the protocol default to **AES-256-GCM** but mention ChaCha20-Poly1305?  
AES-GCM enjoys hardware acceleration (AES-NI) on x86 and ARM, making encryption near-free on most desktops and servers. However, many low-power chips lack AES-NI. ChaCha20-Poly1305 offers comparable security with superior constant-time performance in pure software. The spec therefore defines a cipher suite flag so clients can negotiate the algorithm while remaining interoperable.  

### Explain **AEAD** in one paragraph.  
Authenticated Encryption with Associated Data binds confidentiality and integrity in a single construction. You input a key, a nonce, the plaintext, and optional “associated data” that remains cleartext but must not be tampered with. The cipher returns ciphertext and an authentication tag. On decryption, any change to either ciphertext or associated data causes tag verification to fail, ensuring that altered payloads never reveal partial plaintext.  

### What is a **PSBT** and why does LOCK rely on it?  
A Partially Signed Bitcoin Transaction (BIP-174) is a structured file that separates deterministic fields (inputs, outputs, amounts, scripts) from non-deterministic fields (signatures, redeem scripts). It allows different devices—fee estimator, hardware wallet, mobile cosigner—to add their data in turn without overwriting each other. LOCK implements PSBT flows so that the vault creator can prepare a template, pass it to an offline signer, then to a fee-bumping service, and finally to the broadcaster.  

### Can vaults demand **multisig** authorisation?  
Yes. The metadata merely points to an output script. That script can embed a 2-of-3 multisig in SegWit, a Taproot tree of spending paths, or even an nLockTime-guarded covenant spending condition. PoA only checks that the final transaction is valid under Bitcoin consensus and that it matches the one authorised script hash.  

### How does an **unlock limit** work?  
Metadata may include `unlock_limit: 5`. After each successful PoA, the client appends the txid to a local (or shared) counter. Once five unique txids are recorded, attempts to unlock again are refused. Because the counter is off-chain, dishonest actors could ignore it; for critical metering, the sealer should encrypt five **different** secrets, each requiring a fresh transaction.  

### Is it possible to have a **time-locked** vault?  
Absolutely. Include `earliest_block: 850 000` or `earliest_timestamp: 1780000000` in metadata. PoA will refuse transactions mined before that height or timestamp. Using absolute block heights is safer than timestamps because the latter are miner-editable.  

### Who stores the **SEAL** and where?  
The protocol does not care. A SEAL can live on IPFS with a CID, in S3 with a signed URL, on Arweave for immutability, or be emailed as an attachment. The only requirement is that the unlocker can fetch **exactly** the original bytes; otherwise decryption fails.  

### Can metadata be partially **public**?  
Yes, but this is discouraged. Any cleartext hint may leak pricing strategy, user identity, or product segmentation. If partial transparency is desired—e.g., “price = 100 000 sats” so wallets can autofill—a good practice is to store *only* that numeric field in the header while keeping everything else encrypted.  

### Does LOCK depend on any **smart-contract** extensions like Taproot ASMs?  
No. LOCK is strictly consensus-agnostic. It requires nothing more than the ability to watch validated transactions and compute common Bitcoin libraries (e.g., secp256k1, BIP-32).  

### What does a **change output** do in this context?  
If a wallet’s selected UTXO is larger than the required payment plus fee, the difference is returned to a *change* address controlled by the spender. PoA ignores change outputs entirely as long as the required recipient and amount are present.  

### Is there a **minimum fee** baked into the protocol?  
The spec suggests enforcing a metadata option `min_feerate` so that low-fee spam doesn’t clog mempools and delay unlocks. Absent that field, any fee the network accepts is valid, but most user interfaces default to a reasonable sat/vB floor.  

### Can unlockers pay **more** than the required amount?  
Yes, as long as the metadata condition uses a range operator (e.g., “≥ 100 000 sats”). Fixed-price vaults set the operator to “==”. The trade-off is user friction: an exact match simplifies wallet UI; ranges accommodate fee wiggle-room.  

### How do **hardware wallets** integrate?  
Because PSBT is standard, devices like Ledger, Trezor, Coldcard, and SeedSigner can sign the prepared transaction without firmware changes. Advanced integrations might let firmware read a vault ID from QR and display “You are unlocking vault #E3F2… by paying 100 000 sats to addrX.”  

### Does LOCK expose private keys to any server?  
Never. All key derivation occurs locally. The only secret crossing device boundaries is the *derived symmetric key* embedded in ciphertext, and even that is encrypted with itself via AEAD tags.  

### Can a SEAL include multiple **files**?  
Yes. The payload is arbitrary bytes. You may tarball a directory, embed a zip archive, or store a JSON manifest plus binaries. Only payload size affects performance.  

### How big can a SEAL be?  
The spec imposes no hard limit, but practical limits come from hosting costs and client memory. For multi-gigabyte blobs, implement streaming decryption and chunked uploads.  
