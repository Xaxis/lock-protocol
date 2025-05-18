# VAULT_METADATA_SPEC.md

## Vault Metadata Specification

Vault metadata defines how a sealed vault can be unlocked under the LOCK protocol. It must be encrypted before binding and remain tamper-proof until successfully unsealed.

---

## 🔐 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `authorized_wallet` | string | Wallet address that must sign the unlock TX (`"ANY"` = public access) |
| `amount_condition` | object | Required satoshi amount to be spent in the unlock TX. Type can be `fixed` or `range`. Clients may optionally choose a random value within the range. |
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

MIT — fork or extend.
