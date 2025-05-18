# POA_VALIDATION_RULES.md

## Proof-of-Access (PoA) Validation Rules for LOCK Vaults

This document defines the required validation logic for any client performing a `unseal()` operation under the LOCK protocol.

PoA is the core of the LOCK access model: a Bitcoin transaction must meet vault-defined constraints before access is granted.

---

## 🔐 Core Validation Steps

Every `unseal()` attempt **must** validate the following:

### 1. **Transaction Confirmation**
- The transaction used to trigger unsealing must be:
  - Real (included in a Bitcoin block)
  - Confirmed (at least 1 confirmation)
  - Non-replaceable (RBF disabled)

### 2. **Authorized Wallet Match**

- The unlocking transaction **must be signed by the wallet address specified in the `authorized_wallet` field of the decrypted vault metadata.**
- Clients must:
  - Extract the signing public key from the transaction input (scriptSig or witness)
  - Derive the corresponding address using the correct Bitcoin network
  - Compare the result to `authorized_wallet`
- If `authorized_wallet = "ANY"`:
  - Skip this check
- ⚠️ Do **not** validate against the wallet that signed the original `bind()` transaction — this is not always the same as `authorized_wallet`.

This ensures only the explicitly authorized wallet can unseal the vault, not just the one that created it.


### 3. **Fee Requirement Check**
- Read `fee_requirement.type`:
  - `fixed`: fee must equal `amount`
  - `range`: fee must fall between `min` and `max`
  - `random`: accept 10–1000 sats
- Calculate fee as `inputs - outputs`

### 4. **Block Height (Time Lock)**
- If `time_lock` is present:
  - Current block height must be `>= time_lock`

### 5. **Unlock Limit Enforcement**
- If `unlock_limit` is present:
  - Use local or mirrored counter to ensure attempts are below limit

### 6. **SEAL Integrity Check**
- Decrypt SEAL only after all PoA checks pass
- Validate encryption tag (e.g. GCM or Poly1305)
- Reject if tag fails

---

## ❌ Reject Conditions

Reject unlock if:
- Transaction is unconfirmed or replaceable (RBF)
- Wallet mismatch
- Fee mismatch
- Unlock before time-lock
- Unlock limit exceeded
- SEAL tag fails decryption

---

## 🔍 Example (Pseudocode)

```python
if not is_confirmed(tx) or tx.replaceable:
    raise Error("TX not confirmed or replaceable")

if vault.authorized_wallet != "ANY" and not tx_from_bound_wallet(tx, vault.authorized_wallet):
    raise Error("Unauthorized wallet")

if not fee_matches(tx, vault.fee_requirement):
    raise Error("Fee mismatch")

if vault.time_lock and current_block < vault.time_lock:
    raise Error("Too early")

if vault.unlock_limit and get_unlock_count(vault.id) >= vault.unlock_limit:
    raise Error("Unlock limit exceeded")

if not validate_decryption(seal, key):
    raise Error("Decryption failed")

return decrypt(seal, key)