## Security QAs
> Deep-dive into attack surfaces, cryptographic nuances, operational hazards, and mitigation strategies.

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
