```mermaid
%% LOCK Protocol – end-to-end flow
%% Use LR layout for left-to-right readability
graph LR
  %% ───────────────────  SEALING  ───────────────────
  subgraph SEALING["SEALING (offline)"]
    direction LR
    U[([User / Creator])]
    P["/ Plaintext Payload<br>(file · JSON · licence key) /"]
    METADATA[[Unlock Rules<br>+ Metadata]]
    RNG[[96-bit Random IV]]
    ECDH[[ECDH<br>key-pair]]
    HKDF[[HKDF<br>salt&info = SEAL hash]]
    ENC[[AES-256-GCM<br>(or ChaCha20-Poly1305)]]
    SEAL[[**SEAL<br>encrypted blob**]]

    U --> P --> METADATA --> RNG --> ECDH --> HKDF --> ENC --> SEAL
  end

  %% ───────────────────  BINDING  ───────────────────
  subgraph BINDING["BINDING (on-chain prep)"]
    direction LR
    PSBT[[Prepare PSBT<br>template]]
    SIGN[([Hardware / Mobile Wallet<br>signatures])]
    TX{{Bitcoin Tx<br>meets rules}}
    PSBT --> SIGN --> TX
  end

  %% ───────────────────  BITCOIN NETWORK  ───────────────────
  BTC[(**Bitcoin Network**)]
  TX -->|Broadcast + Confirm| BTC
  BTC -->|Non-replaceable txid| READY[[Vault bound<br>(SEAL ❯ ready)]]

  %% ───────────────────  PROOF-OF-ACCESS  ───────────────────
  subgraph POA["Proof-of-Access (off-chain)"]
    direction LR
    WATCH[[PoA Engine<br>(client)]]
    REKEY[[Re-derive key<br>with HKDF]]
    DECRYPT[[Decrypt SEAL]]
    SECRET[/ Plaintext Secret\n(Unlocked) /]

    BTC -. txid + details .-> WATCH
    SEAL --> WATCH
    WATCH -->|Validate all rules| REKEY --> DECRYPT --> SECRET
  end

  %% ───────────────────  STYLES  ───────────────────
  %% Bitcoin orange for on-chain touchpoints
  classDef btc fill:#F7931A,stroke:#222,stroke-width:2,color:#fff;
  class BTC,TX btc;

  %% Charcoal for crypto operations
  classDef crypto fill:#333,stroke:#888,color:#fff;
  class RNG,ECDH,HKDF,ENC crypto;

  %% Steel blue for user-driven actions
  classDef user fill:#1E3A8A,stroke:#0D223D,color:#fff;
  class U,P,METADATA,PSBT,SIGN user;

  %% Emerald for successful unlock
  classDef success fill:#059669,stroke:#013220,color:#fff;
  class SECRET,READY success;

  %% Neutral grey for PoA engine
  classDef poa fill:#4B5563,stroke:#222,color:#fff;
  class WATCH,REKEY,DECRYPT poa;

  %% SEAL node in dark orange
  classDef seal fill:#D97706,stroke:#794600,color:#fff;
  class SEAL seal;

  %% Titles
  classDef title fill:none,stroke:none,color:#F7931A,font-size:14px,font-weight:bold;
  class SEALING,BINDING,POA title
```
