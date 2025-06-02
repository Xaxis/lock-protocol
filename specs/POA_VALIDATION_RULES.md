# POA_VALIDATION_RULES.md

## Proof-of-Access (PoA) Validation Rules for LOCK Vaults

This document defines the required validation logic for any client performing a `unseal()` operation under the LOCK protocol.

PoA is the core of the LOCK access model: a Bitcoin transaction must meet vault-defined constraints before access is granted.

🧾 Clarification

The Proof-of-Access (PoA) transaction is used to verify compliance with vault conditions (wallet, amount, recipient, time-lock). However, this transaction is not cryptographically tied to the decryption key. It is a signal used by clients to decide whether to permit decryption.

---

## 🔐 Core Validation Steps

Every `unseal()` attempt **must** validate the following:

### 0. **Vault Identification**
- Each vault is uniquely identified by `vault_id = SHA-256(SEAL_bytes || metadata_bytes || txid_bytes)`
- This ID is used for all validation and state tracking
- The `vault_id` must only be derived after the binding transaction is confirmed

### 1. **Transaction Confirmation**
- The `broadcast_tx` used to trigger unsealing must be:
  - Real (included in a Bitcoin block)
  - Confirmed (at least 1 confirmation)
  - Non-replaceable (RBF disabled)

### 2. **Authorized Wallet Match**

- The unlocking transaction **must be signed by at least one wallet address specified in the `authorized_wallet` field**
- `authorized_wallet` can be:
  - A single address (string)
  - An array of addresses (string[])
- Clients must:
  - Extract the signing public key from the transaction input (scriptSig or witness)
  - Derive the corresponding address using the correct Bitcoin network
  - Compare the result to `authorized_wallet`
- If `authorized_wallet = "ANY"`:
  - Skip this check
- ⚠️ Do **not** validate against the wallet that signed the original `bind()` transaction — this is not always the same as `authorized_wallet`.

This ensures only the explicitly authorized wallet can unseal the vault, not just the one that created it.

### 3. **Recipient Wallet Match**
- If `recipient_wallet` is set:
  - `"self"`: at least one output must send BTC back to the sender (input) wallet
  - `"ANY"`: skip this check
  - any other string: at least one output must send BTC to that exact address
- If `recipient_wallet` is **not present**, default to `"self"`

### 4. **Amount Condition Check** (Required Field)
- Read `amount_condition.type`:
  - `fixed`: total amount spent must exactly equal `amount`
  - `range`: 
    1. During PSBT generation: client selects a random amount between `min` and `max`
    2. During on-chain validation: total amount spent must exactly match the selected amount
- Calculate `amount_spent = sum(inputs) - sum(change_outputs)`
- The transaction must satisfy the defined amount condition
- Network fee is separate and not part of this calculation

Example for range:

amount_condition = {
"type": "range",
"min": 8000,
"max": 12000
}

1. Client generates PSBT with amount = 10000 sats (randomly selected within range)
2. On-chain validation must match exactly 10000 sats
3. Any other amount (even within range) will fail validation

### 5. **Recipient Match Check**

- If `recipient_wallet` is:
  - `"self"` (or omitted): at least one output must return funds to the sender's wallet
  - a specific address: at least one output must pay that address
- `"ANY"` is not a valid `recipient_wallet` — use `"authorized_wallet": "ANY"` and `"recipient_wallet": "self"` for public vaults

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

### Amount and Fee Handling

1. **Amount vs Fee Distinction**
   - `amount_condition` refers to the amount spent in the transaction (inputs - change)
   - Network fee is separate and not part of the PoA validation
   - Example:
     ```
     Transaction:
     - Inputs: 100,000 sats
     - Change: 90,000 sats
     - Amount spent: 10,000 sats (for PoA validation)
     - Network fee: 1,000 sats (separate, not part of PoA)
     ```

2. **Client Display**
   Clients should clearly show:
   ```
   Required amount to spend: 10,000 sats
   Estimated network fee: 1,000 sats
   Total transaction cost: 11,000 sats
   ```

3. **Fee Estimation**
   - For `amount_condition.type = "fixed"`:
     - Amount spent must exactly match the condition
     - Fee is additional and separate
     - Example: If amount_condition = 10000 sats
       ```
       Required: 10,000 sats (spent amount)
       + Fee: 1,000 sats (network fee)
       = Total: 11,000 sats (total cost)
       ```

   - For `amount_condition.type = "range"`:
     - Amount spent must fall within the range
     - Fee is additional and separate
     - Example: If amount_condition = {min: 8000, max: 12000}
       ```
       Required: 8,000-12,000 sats (spent amount)
       + Fee: 1,000 sats (network fee)
       = Total: 9,000-13,000 sats (total cost)
       ```

4. **Error Handling**
   - If amount spent doesn't match condition:
     ```
     Error: "Amount spent (9,000 sats) does not match required amount (10,000 sats)"
     ```
   - If fee is too low:
     ```
     Error: "Network fee (500 sats) is too low. Please increase fee rate."
     ```

5. **Implementation Example**
   ```python
   def validate_transaction_amount(tx, amount_condition):
       # Calculate amount spent (inputs - change)
       amount_spent = sum(tx.inputs) - sum(tx.change_outputs)
       
       # Calculate network fee (separate from amount spent)
       network_fee = sum(tx.inputs) - sum(tx.outputs)
       
       # Validate amount spent against condition
       if not amount_matches(amount_condition, amount_spent):
           raise ValidationError(
               code="INVALID_AMOUNT",
               message="Amount spent does not match condition",
               details={
                   "expected": amount_condition,
                   "actual_spent": amount_spent,
                   "network_fee": network_fee
               }
           )
   ```

6. **Client UI Guidelines**
   - Always show amount and fee separately
   - Use clear labels to distinguish between:
     - "Amount to spend" (for PoA)
     - "Network fee" (for miners)
     - "Total cost" (sum of both)
   - Provide fee rate options (e.g., slow/medium/fast)
   - Show fee in both sats and USD (if available)

---

## ❌ Reject Conditions

⚠️ Reject unlock if:
- Transaction is unconfirmed or replaceable (RBF)
- Wallet mismatch
- Amount mismatch
- Unlock before time-lock
- Unlock limit exceeded
- SEAL tag fails decryption

---

## 🔍 Example (Pseudocode)

```python
def unseal(vault, broadcast_tx):
    if not is_confirmed(broadcast_tx) or broadcast_tx.replaceable:
        raise Error("TX not confirmed or replaceable")

    # Validate minimum fee rate (recommended but not required)
    validate_fee_rate(broadcast_tx, min_rate=1)  # 1 sat/vbyte minimum
    
    if vault.authorized_wallet != "ANY" and not tx_from_authorized_wallet(broadcast_tx, vault.metadata.authorized_wallet):
        raise Error("Unauthorized wallet")

    if not recipient_matches(broadcast_tx, vault.recipient_wallet or "self"):
        raise Error("Recipient wallet mismatch")

    if not amount_matches(vault.metadata.amount_condition, broadcast_tx):
        raise Error("Amount condition not satisfied")

    if vault.time_lock and current_block < vault.time_lock:
        raise Error("Too early")

    if vault.unlock_limit and get_unlock_count(vault.id) >= vault.unlock_limit:
        raise Error("Unlock limit exceeded")

    if not validate_decryption(vault.seal, key):
        raise Error("Decryption failed")

    return decrypt(vault.seal, key)

### Transaction Validation States

1. **Unconfirmed Transactions**
   - Reject if any input is unconfirmed
   - Reject if transaction is in mempool but not mined
   - Exception: Allow unconfirmed if all inputs are from same wallet and amount_condition is met
   *Rationale: Prevents double-spend attacks while allowing legitimate use cases*

2. **Error Handling**
   - Invalid amount:
     ```python
     if not amount_matches(condition, tx):
         raise ValidationError(
             code="INVALID_AMOUNT",
             message="Transaction amount does not match condition",
             details={
                 "expected": condition,
                 "actual": calculate_spent_amount(tx)
             }
         )
     ```
   *Rationale: Detailed error information helps users and developers debug issues*

3. **Fee Rate Validation (Recommended)**
   ```python
   def validate_fee_rate(tx, min_rate=1):
       """Validate minimum fee rate (sats/vbyte).
       This is a recommended validation but not required for protocol compliance.
       Clients should use this to ensure transactions are likely to confirm."""
       fee_rate = tx.fee / tx.size
       if fee_rate < min_rate:
           raise ValidationError("Transaction fee rate too low")
       return True
   ```
   *Rationale: Helps ensure transactions will confirm while maintaining protocol flexibility*

   ## License
   
   MIT — feel free to fork, improve, or adapt for other LOCK-compatible clients.
