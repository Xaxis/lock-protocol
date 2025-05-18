# CLIENT_COMPLIANCE.md

## What It Means to Be a LOCK-Compliant Client

This document defines the minimum required behavior for any software claiming to be a LOCK-compatible client.

LOCK is a protocol — not an app. Clients are free to innovate, but they must uphold the core logic: **Proof-of-Access must be enforced**.

---

## ✅ Required Behaviors

To be LOCK-compliant, a client **must**:

- Implement all four protocol actions:
  - `seal()` – encrypts payload + metadata
  - `bind()` – validates and binds to a Bitcoin transaction
  - `unseal()` – verifies PoA and decrypts SEAL
  - `rebind()` – securely transfers ownership with old signature

- Enforce all Proof-of-Access (PoA) conditions:
  - Confirm transaction is on-chain and **non-replaceable** (not RBF)
  - Verify fee conditions (`fixed`, `range`, or `random`)
  - Verify block height is at or after `time_lock`, if set
  - Reject unlock if vault is expired or limit exceeded
  - Match `authorized_wallet` to the TX input signer
  - Validate SEAL integrity (e.g. AES-GCM tag)

- Handle metadata and vault state deterministically:
  - Only derive `vault_id` after valid bind
  - Use consistent SEAL hashing and ID generation

- Track unlock limits securely:
  - Store unlock count persistently
  - Warn on conflicts or ambiguity
  - Optionally support `.unlocklog.json` audit trails

---

## ❌ Disqualifying Behaviors

A client is **not LOCK-compliant** if it:

- Decrypts the SEAL without checking PoA
- Ignores fee or time constraints
- Accepts RBF-enabled transactions as binding
- Accepts transactions without confirming wallet ownership
- Fakes unlock count or skips counter enforcement

> Knowing the key is not enough.  
> **Access must be earned via Bitcoin, not assumed.**

---

## 🧩 Optional Extensions (Still Compliant)

Clients may extend LOCK while staying compatible by:

- Adding UI for vault templates
- Supporting PSBT signing workflows
- Visualizing vault timelines (block height)
- Supporting IPFS or offline vault distribution
- Adding `.unlocklog.json` export and import
- Building watchtower syncs or alerts
- Integrating with Lightning for micro-access

These are optional, as long as core PoA behavior is preserved.

---

## 🔒 Compliance = Validation

LOCK compliance means:
- You don’t store private keys
- You don’t fake unlocks
- You verify all access via Bitcoin TX

LOCK is a validation protocol. If you skip the checks, you’re not part of it.

---

## License

Licensed under MIT. Compliance requires strict PoA enforcement.

## 🧮 Vault ID Canonicalization

All clients must compute the `vault_id` using the following format:

```plaintext
vault_id = SHA-256(SEAL_bytes || metadata_bytes || txid_bytes)
```

Where:

- `SEAL_bytes` = full binary contents of the `.seal` file  
- `metadata_bytes` = encrypted metadata, encoded using a canonical format (CBOR or sorted UTF-8 JSON)  
- `txid_bytes` = 32-byte little-endian binding transaction ID  

This format must be strictly followed to ensure vault compatibility across clients.