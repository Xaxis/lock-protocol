# KEY_DERIVATION.md

## 🔐 Metadata Key Derivation in LOCK

This document defines the standard key derivation function (KDF) for LOCK-compatible clients to securely encrypt and decrypt **vault metadata**. Correct implementation is required for client interoperability and secure access enforcement.

---

## 🎯 Purpose

LOCK does **not** store metadata encryption keys on-chain or in vaults.  
Instead, keys are **derived deterministically** using a secure key agreement mechanism (ECDH + HKDF), ensuring:

- No shared secrets  
- No manual key exchange  
- Predictable key generation across clients  
- Wallet-based access control  

---

## 📐 Design Overview

Each vault has an associated metadata encryption key.  
This key is derived using the following formula:

```plaintext
shared_secret = ECDH(private_key, vault_creator_pubkey)
metadata_key = HKDF-SHA256(
  input_key_material = shared_secret || seal_hash,
  salt = "LOCK-METADATA",
  info = "metadata-encryption-v1",
  output_length = 32 bytes
)
```

| Field | Description |
|-------|-------------|
| `vault_creator_pubkey` | Public key from the signing input of the binding transaction (vault creator) |
| `seal_hash` | SHA-256 hash of the SEAL file (32 bytes) |
| `salt` | Fixed string: `"LOCK-METADATA"` (used for domain separation) |
| `info` | Fixed string: `"metadata-encryption-v1"` (for versioning) |
| `output_length` | 32 bytes (suitable for AES-256-GCM or ChaCha20-Poly1305) |

---

## 🛠️ Inputs

### 1. **ECDH Shared Secret**

- Use ECDH to compute a shared secret between the unlocking wallet’s private key and the vault creator’s public key.

### 2. **seal_hash**

- The SHA-256 hash of the encrypted SEAL payload.  
- Clients must finalize the SEAL before computing the key.

---

## 🔄 Determinism & Compatibility

- Any client with the **SEAL** and valid key agreement setup can re-derive the same metadata key.
- This ensures metadata encryption is portable, stateless, and reproducible.

---

## ⚠️ Security Notes

- Do **not** derive keys from wallet mnemonics or expose private keys.
- Do **not** omit the `salt` or `info` fields — these ensure versioning and domain separation.
- Use only authenticated encryption with the derived key.
- Clients must clearly define how the vault creator’s public key is provided or derived.

---

## 🧪 Example (Pseudocode)

```python
def derive_metadata_key(private_key: bytes, peer_pubkey: bytes, seal: bytes) -> bytes:
    shared_secret = ecdh(private_key, peer_pubkey)
    seal_hash = sha256(seal)
    ikm = shared_secret + seal_hash
    return hkdf_sha256(
        ikm = ikm,
        salt = b"LOCK-METADATA",
        info = b"metadata-encryption-v1",
        length = 32
    )
```

---

## 🧩 Use in Vault Creation

The derived key is used to encrypt all vault metadata fields **before** binding.

Vaults with `visibility = plaintext` skip this step and store metadata unencrypted.

---

## ✍️ Sign-to-Decrypt Flow

Clients must prompt the user to sign a challenge (e.g., the vault_id) using an external wallet.

This signature is used to:

- Extract the pubkey of the signer
- Match that pubkey against `authorized_wallet`
  - If `authorized_wallet` is a list, match must occur within the list
  - If it's a string, match must equal that address
- Use the pubkey to derive shared secret via ECDH
- Then derive the metadata encryption key using HKDF

Only then can the vault metadata be decrypted.

(The client may allow wallet selection or attempt to match the pubkey automatically after signing.)

---

## ✅ Compliance

Clients **must follow this derivation scheme** to be LOCK-compliant.  
Inconsistent derivation logic will lead to incompatible vaults and inaccessible metadata.

---

## 🔐 Encryption Compatibility

The derived `metadata_key` is suitable for:

- **AES-256-GCM** (Recommended default)
- **ChaCha20-Poly1305** (For mobile or performance-constrained environments)

The chosen algorithm must be declared in the vault metadata.

---

## 🧾 License

MIT — security-critical implementations are encouraged to open source.
