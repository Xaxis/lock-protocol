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

- If `authorized_wallet = "ANY"`:
  - Skip this check
- If `authorized_wallet` is a list:
  - At least one input must be signed by a wallet in the list
- If `authorized_wallet` is a string:
  - At least one input must be signed by that address
- Clients must:
  - Extract the signing public key from the transaction input (scriptSig or witness)
  - Derive the corresponding address using the correct Bitcoin network
  - Compare the result to `authorized_wallet`
- ⚠️ Do **not** validate against the wallet that signed the original `bind()` transaction — this is not always the same as ``.

This ensures only (one of) the explicitly authorized wallet(s) can unseal the vault, not just the one that created it.

### 3. **Recipient Wallet Match**
- If `recipient_wallet` is set:
  - `"self"`: at least one output must send BTC back to the sender (input) wallet
  - `"ANY"`: skip this check
  - any other string: at least one output must send BTC to that exact address
- If `recipient_wallet` is **not present**, default to `"self"`

### 4. **Amount Condition Check**

- Read `amount_condition.type`:
  - `fixed`: total amount spent must equal `amount`
  - `range`: total amount spent must fall between `min` and `max`
- Calculate `amount_spent = sum(inputs) - sum(change_outputs)`
- The transaction must satisfy the defined amount condition.
  
### 5. **Recipient Match Check**

- If `recipient_wallet` is:
  - `"self"` (or omitted): at least one output must return funds to the sender’s wallet
  - a specific address: at least one output must pay that address
- `"ANY"` is not a valid `recipient_wallet` — use `"": "ANY"` and `"recipient_wallet": "self"` for public vaults

### 6. **Block Height (Time Lock)**
- If `time_lock` is present:
  - Current block height must be `>= time_lock`

### 7. **Unlock Limit Enforcement**
- If `unlock_limit` is present:
  - Use local or mirrored counter to ensure attempts are below limit

### 8. **SEAL Integrity Check**
- Decrypt SEAL only after all PoA checks pass
- Validate encryption tag (e.g. GCM or Poly1305)
- Reject if tag fails

---

## ❌ Reject Conditions

Reject unlock if:
- Transaction is unconfirmed or replaceable (RBF)
- Wallet mismatch
- Amount mismatch
- Unlock before time-lock
- Unlock limit exceeded
- SEAL tag fails decryption

---

## 🔍 Example (Pseudocode)

```python
if not is_confirmed(tx) or tx.replaceable:
    raise Error("TX not confirmed or replaceable")

if vault.authorized_wallet != "ANY":
    if isinstance(vault.authorized_wallet, list):
        if not any(tx_from_wallet(tx, addr) for addr in vault.authorized_wallet):
            raise Error("No authorized wallet signed the transaction")
    else:
        if not tx_from_wallet(tx, vault.authorized_wallet):
            raise Error("Unauthorized wallet")

if not recipient_matches(tx, vault.recipient_wallet or "self"):
    raise Error("Recipient wallet mismatch")

if not amount_matches(vault.metadata.amount_condition, tx):
    raise Error("Amount condition not satisfied")

if vault.time_lock and current_block < vault.time_lock:
    raise Error("Too early")

if vault.unlock_limit and get_unlock_count(vault.id) >= vault.unlock_limit:
    raise Error("Unlock limit exceeded")

if not validate_decryption(seal, key):
    raise Error("Decryption failed")

return decrypt(seal, key)
