# VAULT_METADATA_SPEC.md

## Vault Metadata Specification

Vault metadata defines how a sealed vault can be unlocked under the LOCK protocol. It must be encrypted before binding and remain tamper-proof until successfully unsealed.

---

## 🔐 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `authorized_wallet` | string or list | One wallet address or list of addresses that may sign the unlock TX. `"ANY"` = public access |
| `amount_condition` | object | Required satoshi amount to be spent in the unlock TX. For `range` type, a specific amount is randomly selected during PSBT generation and must be matched exactly during on-chain validation. |
| recipient_wallet | string (optional) | Where the unlock transaction must send amount. "self" = send back to sender. If omitted, defaults to "self" |
| `txid` | string | Set during `bind()` — TX that anchors ownership |
| `time_lock` | int (optional) | Min block height before unlock allowed |
| `unlock_limit` | int (optional) | Max number of valid unseals allowed |
| `visibility` | string | Either `encrypted` (default) or `plaintext` |
| `version` | int | Metadata schema version (e.g., `1`) |

#### Clarifying `recipient_wallet` Values

| Value         | Meaning                                              |
|---------------|------------------------------------------------------|
| `"self"`      | Funds must return to the unlocking (sender) wallet   |
| `btc address` | Must pay a specific external address                 |
| _omitted_     | Treated as `"self"` by default                       |

Only `"self"` or a specific wallet address should be used.  
`"ANY"` is **not valid** for `recipient_wallet` — it is only used for `authorized_wallet` to define **who may unseal**, not **who must be paid**.

### Amount Condition Types

1. **Fixed Amount**
   - `type`: "fixed"
   - `amount`: exact satoshi amount required
   - Example: `{ "type": "fixed", "amount": 10000 }`

2. **Range Amount**
   - `type`: "range"
   - `min`: minimum satoshi amount
   - `max`: maximum satoshi amount
   - Process:
     1. During PSBT generation: client randomly selects an amount between `min` and `max`
     2. During on-chain validation: transaction must match the selected amount exactly
   - Example: `{ "type": "range", "min": 8000, "max": 12000 }`

### PSBT Generation Process

1. For range-based amount conditions:
   - Client randomly selects an amount between `min` and `max`
   - This selected amount becomes the fixed target for on-chain validation
   - The selected amount must be stored with the PSBT for validation

2. For fixed amount conditions:
   - Use the specified amount directly
   - No selection process needed

3. Network fees:
   - Are separate from the amount condition
   - Must be added to the total transaction cost
   - Should be estimated based on current network conditions

---

## 🛡️ Default Behavior

- Metadata must be encrypted with AES-256-GCM or ChaCha20-Poly1305
- `txid` is appended after sealing
- `authorized_wallet` is mandatory unless public
- `visibility` defaults to `encrypted`

---

## 🔐 Metadata Encryption

Vault metadata is encrypted using a symmetric key derived via HKDF-SHA256. This ensures deterministic key generation without the need for key storage or exchange.

For detailed specifications and implementation guidance, refer to [KEY_DERIVATION.md](./KEY_DERIVATION.md).

---

## ⚠️ Security Notes

- Encrypt **all** metadata unless explicitly opting into `visibility = plaintext`
- For public `authorized_wallet = "ANY"` vaults, to prevent front-running:
  - Use high range or high amount thresholds
  - Encrypt metadata even if the SEAL is intended to be public
  - Avoid early exposure of vault metadata

---

## 🔁 Example (Before Encryption - as a self-spend to owner)

```json
{
  "authorized_wallet": "bc1qxyz...",
  "recipient_wallet": "self",
  "amount_condition": {
    "type": "fixed",
    "amount": 10000
  },
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "encrypted",
  "version": 1
}
```

## 🔁 Example (Before Encryption - as a spend to external address)

```json
{
  "authorized_wallet": "bc1qxyz...",
  "recipient_wallet": "bc1qtarget...",
  "amount_condition": {
    "type": "range",
    "min": 10000,
    "max": 50000
  },
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "encrypted",
  "version": 1
}
```

## 🔁 Example (Before Encryption - as a public pay-to-unseal-vault)

```json
{
  "authorized_wallet": "ANY",
  "recipient_wallet": "bc1qvaultowner...",
  "amount_condition": {
    "type": "fixed",
    "amount": 10000
  },
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "encrypted",
  "version": 1
}
```

## 🔁 Example (Before Encryption — Multiple Authorized Wallets that can unseal)

```json
{
  "authorized_wallet": [
    "bc1qxyz...",
    "bc1qabc...",
    "bc1qdef..."
  ],
  "recipient_wallet": "self",
  "amount_condition": { "type": "fixed", "amount": 10000 },
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "encrypted",
  "version": 1
}


### Multiple Authorized Wallets Examples

1. **Shared Access Vault**
```json
{
  "authorized_wallet": [
    "bc1qxyz...",  // Primary owner
    "bc1qabc...",  // Backup wallet
    "bc1qdef..."   // Emergency access
  ],
  "amount_condition": {
    "type": "range",
    "min": 5000,
    "max": 15000
  }
}
```
*Use case: When you need multiple access levels with different priorities*

2. **Threshold Access Vault**
```json
{
  "authorized_wallet": [
    "bc1qxyz...",  // Team member 1
    "bc1qabc...",  // Team member 2
    "bc1qdef..."   // Team member 3
  ],
  "amount_condition": {
    "type": "fixed",
    "amount": 10000
  },
  "unlock_limit": 1
}
```
*Use case: When any team member should be able to access, but only once*

3. **Inheritance Vault**
```json
{
  "authorized_wallet": [
    "bc1qxyz...",  // Current owner
    "bc1qabc...",  // Beneficiary
    "bc1qdef..."   // Executor
  ],
  "amount_condition": {
    "type": "fixed",
    "amount": 10000
  },
  "time_lock": 850000
}
```
*Use case: Estate planning with multiple stakeholders*

## 📝 Examples

### Example 1: Fixed Amount
```json
{
  "authorized_wallet": "bc1q...",
  "amount_condition": {
    "type": "fixed",
    "amount": 10000
  },
  "recipient_wallet": "self",
  "txid": "1234...",
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "public",
  "version": 1
}
```

### Example 2: Range Amount
```json
{
  "authorized_wallet": "bc1q...",
  "amount_condition": {
    "type": "range",
    "min": 5000,
    "max": 15000
  },
  "recipient_wallet": "self",
  "txid": "1234...",
  "time_lock": 850000,
  "unlock_limit": 1,
  "visibility": "public",
  "version": 1
}
```

### Example 3: Range Amount with Multiple Authorized Wallets
```json
{
  "authorized_wallet": ["bc1q...", "bc1p..."],
  "amount_condition": {
    "type": "range",
    "min": 10000,
    "max": 20000
  },
  "recipient_wallet": "bc1q...",
  "txid": "1234...",
  "time_lock": 850000,
  "unlock_limit": 3,
  "visibility": "public",
  "version": 1
}
```

### Example 4: Range Amount with No Time Lock
```json
{
  "authorized_wallet": "bc1q...",
  "amount_condition": {
    "type": "range",
    "min": 1000,
    "max": 5000
  },
  "recipient_wallet": "self",
  "txid": "1234...",
  "unlock_limit": 1,
  "visibility": "public",
  "version": 1
}
```

### Example 5: Range Amount with Infinite Unlocks
```json
{
  "authorized_wallet": "bc1q...",
  "amount_condition": {
    "type": "range",
    "min": 50000,
    "max": 100000
  },
  "recipient_wallet": "self",
  "txid": "1234...",
  "time_lock": 850000,
  "visibility": "public",
  "version": 1
}
```

## License

MIT — feel free to fork, improve, or adapt for other LOCK-compatible clients.
