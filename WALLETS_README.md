# 🔐 Wallet Integration Guide for UNSEAL

This folder contains secure wallet integration modules for the UNSEAL client — the first client built on the LOCK protocol.

All signing operations must follow these principles:
- **No private keys are ever exposed or stored**
- **All signing is performed externally**, using PSBTs, QR codes, or files
- **All wallet integrations must be stateless, deterministic, and verifiable**

---

## 🧱 Supported Wallets (Target Integrations)

| Wallet           | Interface Type     | Notes |
|------------------|--------------------|-------|
| Coldcard         | File-based PSBT    | Airgapped signing via microSD |
| Specter Desktop  | JSON-RPC or manual | Useful for multisig, xpub derivation |
| Sparrow Wallet   | QR / File PSBT     | Developer-friendly and watch-only capable |
| Keystone         | QR-based PSBT      | Ideal for mobile workflows |
| Electrum         | CLI or plugin      | Optional power-user integration |

---

## 🔁 Signing Flow (General)

1. **UNSEAL generates a PSBT** for `bind()` or `unseal()`
2. The PSBT is:
   - Saved to file, or
   - Displayed as QR
3. The user signs using their wallet
4. The signed transaction is imported into UNSEAL
5. UNSEAL broadcasts and proceeds with PoA verification

---

## 🔒 Key Security Guidelines

- UNSEAL **never holds private keys**
- `xpub` or watch-only mode can be used for previewing UTXOs
- Any module in this folder **must not leak signing intent** before confirmation

---

## 📂 Folder Structure

Each integration lives in its own subfolder:

```
wallets/
├── coldcard/
│   └── sign_coldcard.py
├── sparrow/
│   └── sparrow_psbt_guide.md
├── specter/
│   └── specter_rpc.py
└── README.md  ← (this file)
```

---

## ✅ Implementation Requirements

All wallet modules must:
- Be auditable and minimal
- Follow standard PSBT formats
- Avoid any use of third-party signing APIs
- Work offline where possible

---

## Future Work

- Add QR-based signing flows
- Add `--xpub` watch-only wallet support
- Auto-detect wallet type via client config

---

## License

MIT — feel free to fork, improve, or adapt for other LOCK-compatible clients.
