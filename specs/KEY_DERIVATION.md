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

## 🔐 Key Derivation Scope

The symmetric key used to decrypt the metadata or SEAL is derived from:

shared_secret = ECDH(creator_pubkey, unlocker_pubkey)

symmetric_key = HKDF(shared_secret || seal_hash)

Importantly, this key derivation does not include the PoA transaction or its TXID. This design enables vaults to be sealed and published before any Bitcoin transaction has been submitted.

---

## 🛠️ Inputs

### 1. **ECDH Shared Secret**

- Use ECDH to compute a shared secret between the unlocking wallet's private key and the vault creator's public key.

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
- Clients must clearly define how the vault creator's public key is provided or derived.

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

## 🔒 Formal Security Proofs

The key derivation scheme in LOCK is designed to provide the following security guarantees:

### 1. Key Uniqueness
For any two distinct vaults V1 and V2:
```python
# If either the SEAL or creator public key differs, the derived keys must be different
if (V1.seal_hash != V2.seal_hash) or (V1.creator_pubkey != V2.creator_pubkey):
    assert derive_key(V1) != derive_key(V2)
```

This ensures that:
- Each vault has a unique metadata encryption key
- Keys cannot be reused across different vaults
- Collisions are computationally infeasible

### 2. Forward Secrecy
The key derivation scheme provides forward secrecy:
```python
# Note: Wallet compromise is typically discovered after the fact
# This property ensures that even if a compromise is discovered later,
# previously created vaults remain secure
def forward_secrecy_property():
    # Even if a private key is compromised (whether known or unknown)
    # All previously derived keys remain secure
    for vault in all_vaults:
        if vault.created_before_compromise:
            assert is_key_secure(vault.metadata_key)
```

This means:
- Historical vaults remain secure even if a wallet is later discovered to be compromised
- The security of past vaults doesn't depend on the current state of the wallet
- Each vault's security is independent of when a compromise might be discovered

#### How Past Vaults Remain Secure

1. **Unique Components**
   - Each vault's key depends on two unique components:
     - The `seal_hash` (unique to each vault)
     - The `shared_secret` (unique to each key derivation)
   - Both components are required to derive the correct key

2. **Security Through Uniqueness**
   - Even if an attacker gets your private key:
     - They cannot recreate the exact `seal_hash` of past vaults
     - They cannot know the exact `shared_secret` used in past derivations
     - Without both components, they cannot derive the correct key

3. **One-Way Security**
   - The key derivation process is one-way:
     - You can derive a key from the components
     - You cannot derive the components from the key
   - This means even if a key is exposed, it cannot be used to compromise other vaults

4. **Independent Security**
   - Each vault's security is independent because:
     - Each vault has a unique `seal_hash`
     - Each key derivation uses a fresh `shared_secret`
     - The HKDF process ensures keys are cryptographically separated

⚠️ **Important Note on Compromise Detection**:
- The protocol itself does not detect wallet compromise
- Compromise is typically discovered through:
  - Unauthorized transactions
  - External security audits
  - User observation of suspicious activity
- Users should monitor their wallets and take appropriate action if compromise is suspected

### 3. Key Independence
The derived keys are computationally independent:
```python
# For any vault V, its key is independent of:
def key_independence_property(vault):
    key = derive_key(vault)
    
    # Independent of other vault keys
    assert not is_related(key, other_vault_keys)
    
    # Independent of wallet private keys
    assert not is_related(key, wallet_private_keys)
    
    # Independent of SEAL contents
    assert not is_related(key, vault.seal_contents)
```

This ensures:
- Keys cannot be derived from other vault keys
- Keys cannot be derived from wallet private keys
- Keys cannot be derived from SEAL contents

### 4. Security Assumptions

The security of the key derivation scheme relies on:

1. **ECDH Security**
   - The discrete logarithm problem is hard in the elliptic curve group
   - ECDH shared secrets are computationally indistinguishable from random

2. **HKDF Security**
   - The underlying hash function (SHA-256) is collision-resistant
   - The HKDF construction provides a secure key derivation function

3. **Random Oracle Model**
   - The hash function behaves as a random oracle
   - No efficient algorithm can distinguish the output from random

### 5. Security Properties

The key derivation scheme provides:

1. **Confidentiality**
   - Metadata encryption keys cannot be derived without the correct private key
   - Even with the SEAL and public key, the metadata key remains secure

2. **Integrity**
   - Any modification to the SEAL or metadata invalidates the key
   - Tampering with the binding transaction breaks the key derivation

3. **Availability**
   - Keys can be derived by any client with the correct inputs
   - No online services or external dependencies required

### 6. Implementation Requirements

To maintain these security properties, implementations must:

1. **Use Secure Primitives**
   - ECDH with a secure curve (e.g., secp256k1)
   - HKDF-SHA256 for key derivation
   - AES-256-GCM or ChaCha20-Poly1305 for encryption

2. **Handle Inputs Securely**
   - Validate all inputs before key derivation
   - Use constant-time operations where possible
   - Clear sensitive data from memory after use

3. **Maintain Protocol Compliance**
   - Follow the exact derivation steps
   - Use the specified salt and info parameters
   - Validate all security checks

---

## 🧾 License

MIT — security-critical implementations are encouraged to open source.
