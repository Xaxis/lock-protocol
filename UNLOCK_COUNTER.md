# UNLOCK_COUNTER.md

## Secure Unlock Counter Handling in LOCK-Compatible Clients

Vaults with an `unlock_limit` must track unlocks persistently. This prevents replay and preserves expected behavior across sessions or devices.

---

## 🔢 Strategies

### 1. Local + Persisted
- Store `vault_id → unlock_count` in secure local storage
- Use append-only logs for audit trail
- Exportable to `.unlocklog.json`

### 2. Mirror via TX History
- Scan known wallet TXs
- Check if they satisfy PoA for vault
- Count valid ones as unlocks

### 3. Watchtower / Remote Auditing
- External service monitors unlocks
- Optional, enterprise-grade

---

## 🧩 Example Unlock Log

```json
{
  "vault_id": "abc123...",
  "txid": "abcd...",
  "timestamp": 1729483298,
  "block_height": 847001,
  "confirmed": true
}
```

---

🔄 **Replay Mitigation Reminder**

LOCK vaults are uniquely identified by their `vault_id`, which includes the TXID. This prevents **cross-vault** replay attacks.

However, to prevent **same-vault** replays (e.g., multiple unseals using the same PoA transaction), clients should record each successful unlock in a `.unlocklog.json` file and reject any repeated use of the same TXID.

---

## License

MIT — security-critical implementations encouraged to open source.
