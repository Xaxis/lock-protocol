## Future QAs
> Speculative research directions, roadmap milestones, and open questions for the community.

### What is the path to **formal verification**?  
Translate the PoA state machine into TLA+ or Coq. Prove safety (if PoA passes, rules were satisfied) and liveness (if rules are satisfied, PoA eventually passes). Generate executable test cases from proofs and integrate into CI for all client libraries.  

### Will we see **Taproot commitments**?  
Future versions might embed a vault ID in a Taproot leaf, making the unlock spend provably linked to a vault without OP_RETURN bloat. This could enable “pay-to-vault” donations where the secret remains unknown until path reveal.  

### Can LOCK support **oracle-based** conditions?  
Yes. Use adaptor signatures or discrete-log contracts: metadata says “unlock if BTC/USD > $100 k.” A trusted oracle posts a signature that completes the transaction only when the price trigger fires. The vault key derives from the completed signature.  

### What about **post-quantum** key derivation?  
Swap ECDH for ML-KEM. HKDF remains, but salts increase in size. Cipher suite flags in the header allow backward compatibility: old clients skip vaults with unknown PQ suites.  

### Is **cross-chain PoA** viable?  
An Ethereum or Solana user might wish to unlock by burning their token. Bridging would require SPV proofs or zk-SNARKs verifying the foreign chain’s transaction inside a Bitcoin sidecar. Research is ongoing.  

### Can we create **zero-knowledge unlock proofs**?  
Use zk-SNARKs to prove knowledge of a Bitcoin transaction that meets metadata without revealing which one. The SNARK proof replaces raw txid in PoA. This enables anonymous pay-to-unlock where chain surveillance cannot link payment to content.  

### What’s next for **reference implementations**?  
- TypeScript library for browsers and Node.  
- Rust crate optimised for server-side bulk PoA.  
- Python client for data scientists.  
- Go micro-service for embedding in clusters.  

### Should there be a **governance foundation**?  
A non-profit could steward the spec, run interoperability hackathons, and fund audits. Membership via annual donations, no token.  

### Could LOCK integrate with **Nostr**?  
Yes. Post SEAL hashes and metadata as Nostr events. Subscribers listen for vault offers and pay directly. Decryption happens in the Nostr client. This merges social discovery with instant pay-to-unlock.  

### What about **Layer-2** unlocks on Lightning?  
A submarine swap from Lightning to on-chain could trigger an automatic unlock once the swap completes, blending Lightning speed with on-chain auditability. 

### Will machine learning models be **sealed**?  
Large language models are multi-gigabyte binaries. Sealing them forces buyers to prove on-chain commitment before download, combating piracy in the AI model marketplace.  

### Can LOCK be used for **IoT firmware** distribution?  
Yes. Manufacturers seal firmware images; devices with embedded Bitcoin SPV clients verify PoA before flashing. Rogue servers can’t push malicious updates because they lack a valid spend.  

### Could there be **grant funding** for open-source tooling?  
Yes. Bitcoin-focused grants from HRF, Spiral, or OpenSats could bankroll reference wallets, audit work, and educational material to accelerate adoption.  

### What’s the biggest **unknown**?  
Human factors: will users tolerate on-chain fees and confirmation waits? UX research and wallet integrations will determine widespread adoption.  
