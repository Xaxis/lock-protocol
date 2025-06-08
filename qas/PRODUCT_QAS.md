## Product QAs
> Implementation ideas, business models, and real-world workflows illustrating how the protocol can underpin actual products.

### What is the most minimal **proof-of-concept** product?  
A single-page web app where creators drag-and-drop a file, enter a price, and click **Seal**. The app writes the SEAL to IPFS, returns a public CID plus a Lightning “fallback” invoice for those who prefer LN. Consumers click the link, see the price, pay the on-chain transaction, and the page auto-refreshes when PoA passes, revealing a download button. No user accounts, no database—just client-side JavaScript and an IPFS gateway.  

### How could a **media outlet** use LOCK for pay-per-article access?  
Each premium article is exported as a self-contained HTML file or PDF, then sealed with a rule “≥ 5000 sats to outlet-treasury address.” Readers’ browsers run a lightweight WebAssembly PoA module; upon detection of an eligible transaction, the encrypted article decrypts in-place. The outlet never stores passwords or card data, and the reader gains a permanent proof of purchase on-chain.  

### Describe a **software licence** vending flow.  
1. Vendor encrypts a licence key in a SEAL.  
2. Metadata demands payment ≥ 0.002 BTC to a multisig treasury address.  
3. Customer pays; PoA passes; client extracts the key.  
4. Client library sends the txid and licence hash to the vendor’s API.  
5. Vendor checks mempool, records account as “paid,” and issues automatic updates.  

### Can LOCK support **subscription** models?  
Indirectly. The creator reseals content monthly with a new SEAL ID and unlock rules. Subscribers repeat the on-chain payment. Alternatively, Lightning can handle recurring micro-payments, and LOCK is reserved for initial activation or large quarterly bundles that need future-proof auditability.  

### What is a **dead-man’s switch** product powered by LOCK?  
A whistle-blower encrypts incriminating documents. Unlock rules: “Anyone may pay at least 0.05 BTC *after* block 900 000.” They publish the SEAL CID publicly. As long as the whistle-blower keeps resetting the earliest block in a hypothetical “Re-seal” feature, the secret stays locked. If they die or are silenced, activists can unlock by paying the fee, triggering automatic publication.  

### A **ticketing** implementation for events?  
Each seat has a unique QR code embedded in a SEAL. Unlock conditions: “Pay exactly 100 000 sats to stadium-multisig within time window T.” Once a spectator pays, PoA reveals the seat’s QR, which is scanned at entry. No scalpers can double-sell because the spending transaction is single-use and publicly verifiable.  

### Could LOCK facilitate **royalty splits**?  
Yes. Metadata can declare multiple mandatory outputs: 60 % to artist, 30 % to producer, 10 % to developer. PoA insists the unlocking transaction satisfy this output map. Wallets implementing BIP-47 reusable payment codes or PayJoin can automate the split, ensuring fair revenue distribution at protocol level.  

### How would a **SaaS API pay-as-you-go** model work?  
Encrypt a JSON token granting, say, 10 000 API calls. Price: 15 000 sats. Each time the token nears exhaustion, the SaaS dashboard offers a new SEAL link for another bundle. Because the unlock transaction is on-chain, the vendor never risks chargeback fraud and can see at a glance how many tokens are outstanding.  

### Is there a zero-backend **progressive web app** approach?  
Yes. Ship the entire sealing and unsealing logic in the browser with in-memory storage. For hosting, pin SEALs to public IPFS, and let clients directly query electrum servers or public Esplora APIs for transaction data. The only backend you might optional run is a mempool websocket relay, but even that can be replaced by open infrastructure.  

### Can LOCK coexist with **Lightning**?  
Certainly. Lightning excels at instant micro-payments and streaming content. A hybrid model might use LN for real-time access (e.g., per-second video streaming) and LOCK for “buy-to-own” downloads or large unlocks that need an immutable record. Both flows deposit revenue to the same treasury wallet.  

### What are the UX **pain points** for mainstream users?  
- Crafting on-chain transactions without exposing them to timing risks.  
- Understanding why an unlock failed (wrong amount, unconfirmed, fee too low).  
- Waiting for confirmations when block space is congested.  
- Handling mulltiple wallets or hardware signers in multi-device workflows.  

### How can wallets improve the **signing experience**?  
Wallet firmware can read the PSBT, detect a `proprietary:lock:seal_id` field, and display: “This payment unlocks ‘premium-guide-2025.pdf’ for 0.0001 BTC.” Clear prompts reduce phishing risk and aid adoption.  

### Is there a **marketplace** potential?  
Yes. A “LOCK Hub” akin to npm or Docker Hub could host SEALs, display price-tags, version numbers, and seller reputation. Buyers would filter by category and pay directly from the browser. The hub never touches keys, merely lists metadata and CIDs.  

### What does a **compliance dashboard** look like for creators?  
A web console shows: SEAL ID, total unlocks, cumulative revenue, top spender addresses, average fee, and geographic heat-map (via IP lookup on download requests). Because on-chain data is public, the dashboard can compute revenue trustlessly.  

### Can a creator provide **refunds**?  
Technically yes: they can whip up a PSBT returning sats to the spender’s address. However, refunds defeat the irreversible nature of Proof-of-Work. Most businesses would instead reseal a second secret labelled “refund voucher” and unlock it to the aggrieved user for free.  

### What **open-source licences** best fit LOCK-gated software?  
Dual licences. Offer GPL-3 for non-commercial users unlocked trivially (or given away), and a commercial licence sealed behind a 0.01 BTC paywall. The on-chain proof acts as purchase evidence. 

### How would a **charity pay-to-reveal** campaign work?
An NGO seals a high-resolution report detailing illegal deforestation evidence. Unlock condition: “When cumulative donations to address X reach 5 BTC, the report decrypts automatically.” Donors collectively fund the target; the final transaction pushes the total over the threshold, PoA passes, the secret becomes public.  

### How might a **content bundle** sale work during a holiday?  
Black-Friday.zip is sealed at 50 % discount. Metadata sets an `expiry_block` after which PoA will fail. Shoppers rush to purchase before the deadline. The system self-sunsets without the seller coordinating time-zones or payment processors.  

### What’s an **education** use-case?  
A professor locks lecture slides; students pay a small fee, and each txid doubles as attendance proof. Automatic CSV export of addresses can feed into a grading spreadsheet.  

### Could an author **pre-sell** a book via LOCK?  
Yes. Seal the manuscript; require a payment plus an OP_RETURN that encodes the buyer’s e-mail hash. When the threshold of 1000 unlocks is reached, the author knows the book is profitable enough to print physical copies.  
