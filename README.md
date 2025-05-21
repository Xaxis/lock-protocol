# LOCK Protocol

> **A Bitcoin-based access protocol for encrypted secrets — verifiable access through proof-of-work, not permission.**

**LOCK** is a minimal, open protocol that uses Bitcoin transactions as cryptographic proofs to unlock encrypted secrets — with no accounts, no passwords, and no servers.

It introduces a **Sovereign Access Layer (SAL)** where digital secrets are not granted by permission — but proven by action, enforced by Bitcoin.

---

Created by: Bram Kanstein ([@bramk](https://x.com/bramk))

---

## 🔒 What Is LOCK?

LOCK turns access control into an act of energy:

- A secret is **sealed** into an encrypted vault (a **SEAL**)
- Unlock conditions are defined in encrypted **metadata**
- A **Bitcoin transaction** that meets those conditions is the **only way** to decrypt

There are no accounts. No identities. No passwords to reset. Just proof.

---

## 🧠 What LOCK Introduces

### 1. **Proof-of-Access (PoA)**
A valid Bitcoin transaction is used to unlock secrets — based on wallet signature, fee amount, and optional block height. No on-chain logic or storage required.

### 2. **Vault Binding Primitive**
Vaults are cryptographically bound to a real Bitcoin transaction signed by a wallet. This makes energy expenditure the key — not identity or permission.

### 3. **Sovereign Access Layer (SAL)**
A new access layer that is:

- Stateless
- Serverless
- Verifiable anywhere
- Secured by Bitcoin

LOCK doesn't rely on who you are. It relies on what you've done — on-chain.

---

## 📁 What's in This Repo

This repository contains the full LOCK protocol specification, including:

| File | Description |
|------|-------------|
| `LOCK Verifiable Access Through Proof-of-Work-V1.1.md` | 📘 Full protocol whitepaper |
| `SEAL_FORMAT_SPEC.md` | 📦 Encrypted payload file format |
| `VAULT_METADATA_SPEC.md` | 🧾 Metadata schema and visibility rules |
| `POA_VALIDATION_RULES.md` | 🔐 Unlock transaction checks |
| `UNLOCK_COUNTER.md` | 🔁 Off-chain unlock tracking logic |
| `REBIND_GUIDE.md` | 🔁 Vault ownership transfer protocol |
| `CLIENT_COMPLIANCE.md` | ✅ What compliant clients must enforce |
| `KEY_DERIVATION.md` | 🔑 Metadata encryption key derivation |
| `WALLETS_README.md` | 💳 Wallet + PSBT integration overview |

Specs are also located in [`/specs`](./specs).

---

## ⚠️ Security Notes

LOCK is a protocol — not a product or app.  
**Security depends on client compliance.**

Clients must:

- Track unlock limits accurately
- Encrypt metadata by default
- Reject RBF and unconfirmed transactions
- Use external signing (e.g., PSBTs)
- Honor all PoA validation rules

See `CLIENT_COMPLIANCE.md` for full requirements.

---

## 💬 Ask Any Question About LOCK

Got a question about the LOCK Protocol?  
Curious about how vaults, PoA, SEALs, or rebinding work?

🧠 [**Talk to the LOCK Protocol GPT Assistant**](https://chat.openai.com/g/g-Wp6a2quRl-lock-protocol-assistant-ask-me-anything)  
The official AI companion for developers, builders, and researchers.

- Explains the protocol in plain or technical terms
- Walks you through sealing, binding, unsealing, and rebinding
- Context-aware: adapts to your level (Beginner, Developer, or Auditor)
- Based on the official whitepaper and specs in this repo

---

## 🛠️ Status

- ✅ Protocol specification complete
- 🧪 Formal audit + test suite coming
- 🔧 CLI reference implementation in progress

---

## 📜 License

MIT — permissionless and open by design.  
Fork it, implement it, or extend it freely.

---

## 🌐 Learn More

📘 [Read the Whitepaper](./WHITEPAPER.md)  
💬 Community, clients, and contributions welcome.

## 👥 Follow For Updates

- **GitHub**: [Contribute](https://github.com/bramkanstein/lock-protocol/)
- **Twitter**: [Follow @bramk](https://x.com/bramk)
