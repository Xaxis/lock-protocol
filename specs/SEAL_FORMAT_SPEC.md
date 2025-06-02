# SEAL_FORMAT_SPEC.md

## SEAL File Format Specification

This document defines the official file format used to store encrypted payloads in the LOCK protocol.

SEAL files are sealed, portable containers that hold encrypted content (e.g. files, messages, instructions) alongside metadata necessary to verify and decrypt them once Proof-of-Access (PoA) conditions are satisfied.

---

## 📄 File Extension

SEAL files **must** use the `.seal` extension.

Example:
whitepaper_block_850000.seal

---

## 🧱 File Structure (Binary Layout)

| Field              | Type        | Description |
|-------------------|-------------|-------------|
| `magic`           | `4 bytes`   | ASCII identifier `SEAL` for file recognition |
| `version`         | `uint8`     | Format version identifier (e.g. `1`) |
| `encryption_algo` | `string`    | Algorithm used: `AES-256-GCM` or `ChaCha20-Poly1305` |
| `nonce`           | `bytes`     | Unique nonce/IV used for encryption |
| `ciphertext_len`  | `uint32`    | Length of ciphertext in bytes (**little-endian**) |
| `ciphertext`      | `bytes`     | The encrypted payload |
| `integrity_tag`   | `bytes`     | Authentication tag (e.g. GCM tag or Poly1305) |
| `metadata_hint`   | `string?`   | Optional plaintext MIME-type or client hint (length-prefixed) |

All fields are stored sequentially in binary form. Multi-byte fields must use **little-endian** byte order to ensure cross-platform compatibility.

---

## 🔐 Encryption Requirements

- Must use authenticated symmetric encryption:
  - **AES-256-GCM** (required)
  - **ChaCha20-Poly1305** (optional but recommended)
- Encryption key is **not stored** in the file
- Integrity is enforced via the `integrity_tag`

Clients **must** support AES-256-GCM. ChaCha20 is optional but encouraged for mobile or hardware-constrained devices.

---

## 🧪 Checksum / Integrity Validation (Optional)

Clients should optionally generate a SHA-256 checksum of the full `.seal` file to enable long-term storage integrity (bit rot protection).

Example checksum file:
whitepaper_block_850000.seal.sha256

Contents:
e4b0fbdc3f7c58e27ad9f... whitepaper_block_850000.seal


This checksum:
- Is not part of the protocol
- Can be used for vault integrity auditing
- May assist with archive validation

---

## 🧩 Metadata Hint (Optional)

The optional `metadata_hint` field may contain:
- MIME type (e.g. `application/pdf`, `text/plain`)
- Display label
- LOCK-specific annotations (`LOCK-VAULT:<id>`)

This field is unencrypted and for **client UI only**. It must be length-prefixed to avoid ambiguity and follow standard UTF-8 encoding.

---

## 🛑 What the SEAL Does *Not* Contain

- No metadata rules
- No wallet bindings
- No PoA logic
- No signature material
- No PSBT information (including selected amounts for range conditions)

Those live in the **vault metadata**, encrypted separately.

---

## 🔒 Summary

A `.seal` file:
- Is always encrypted
- Must pass PoA validation before decryption
- Contains no secrets in plaintext
- Is portable, inspectable, and secure

---

## 🔑 Key Derivation (Clarification)

Decryption of the SEAL requires a symmetric key derived using:
  
  shared_secret = ECDH(creator_pubkey, unlocker_pubkey)
  symmetric_key = HKDF(shared_secret || seal_hash)

- `seal_hash` is the SHA-256 hash of the full `.seal` file contents
- No Bitcoin transaction or transaction ID is used in the derivation

This design allows the SEAL to be created and encrypted **before** any Bitcoin transaction exists. PoA validation still governs *when* and *by whom* the SEAL can be decrypted, but the symmetric key is computed independently from transaction data.

---

## ✅ Reference Implementation

See: `Vault::decrypt()`, `SEALParser::read()`  
Examples in: `unseal-client`, `specs/examples/`

---

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

## License

MIT — feel free to fork, improve, or adapt for other LOCK-compatible clients.
