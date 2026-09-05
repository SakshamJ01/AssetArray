# AssetArray v3.1 Security & Cryptographic Model

## 1. Zero-Knowledge Cryptographic Architecture

AssetArray operates on a strict **Zero-Knowledge Architecture**. The backend storage layer possesses neither the encryption keys nor the plaintext representations of client investment data, transaction histories, or notes.

```mermaid
sequenceDiagram
    participant User as Wealth Advisor
    participant App as AssetArray Client
    participant KeyDeriv as PBKDF2 Engine
    participant Crypto as AES-256-GCM
    participant Cloud as Backend Server (Mongo)

    User->>App: Enters Master Passphrase / PIN
    App->>KeyDeriv: Passphrase + Salt (100,000 rounds)
    KeyDeriv-->>App: 256-bit Symmetric Key
    Note over App: In-memory only; never persisted
    App->>Crypto: Encrypt(ClientPayload, Key, IV)
    Crypto-->>App: Ciphertext + AuthTag + IV + Salt
    App->>Cloud: POST /api/sync/push { ciphertext, ownerId }
    Note over Cloud: Cloud stores opaque ciphertext only
```

---

## 2. Cryptographic Specifications

- **Symmetric Encryption**: Advanced Encryption Standard (AES) with 256-bit key length.
- **Key Derivation Function**: PBKDF2 (Password-Based Key Derivation Function 2) using HMAC-SHA256 with 100,000 iterations and a cryptographically secure 16-byte random salt.
- **Data at Rest**: Local state in `@react-native-async-storage/async-storage` is encrypted with device keychain/keystore protected biometric tokens (`expo-local-authentication`).
- **Data in Transit**: Enforced TLS 1.3 for all HTTP/WebSocket transport.

---

## 3. Backend Hardening & API Security

Located at `backend/server.js`:

1. **Helmet Security Headers**: Strict Content-Security-Policy (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options: nosniff, and X-Frame-Options: DENY.
2. **CORS Whitelisting**: Restricted origin headers preventing cross-site scripting invocations.
3. **Rate Limiting**: Tiered IP-based rate limiting (100 requests per 15-minute window for sync endpoints; 20 requests per minute for AI analysis proxies).
4. **Input Sanitization & Schema Validation**:
   - Strict array checks on holding collections.
   - Numerical bounds validation preventing negative valuation exploits or division by zero.
   - Nonce validation preventing replay attacks.
5. **Session Management**: Cryptographically signed JWT tokens with rolling expiration (15 minutes access token, 7 days refresh token stored in secure httpOnly cookies where supported).

---

## 4. Compliance Posture

- **India DPDP Act 2023**: Comprehensive client-side PII redactor removes all identifiers prior to external LLM calls.
- **SEBI (Investment Advisers) Regulations, 2013**: Audit trails, risk profiling records, and transaction logs are timestamped and preserved with immutable local revision histories.
- **OWASP Mobile & Top 10**: Complete defense against SQL/NoSQL injection, insecure direct object references, and broken authentication.
