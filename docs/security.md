# AssetArray v3.2 Security & Cryptographic Model

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
    App->>Cloud: POST /api/sync { ciphertext, ownerId }
    Note over Cloud: Server verifies ownerId matches JWT token
    Cloud-->>App: 200 OK (Encrypted payload stored)
```

---

## 2. Cryptographic Specifications

- **Symmetric Encryption**: Advanced Encryption Standard (AES) with 256-bit key length in GCM mode.
- **Key Derivation Function**: PBKDF2 (Password-Based Key Derivation Function 2) using HMAC-SHA256 with 100,000 iterations and a cryptographically secure 16-byte random salt.
- **Data at Rest**: Local state in `@react-native-async-storage/async-storage` is encrypted with device keychain/keystore protected biometric tokens (`expo-local-authentication`).
- **Data in Transit**: Enforced TLS 1.3 for all HTTP/WebSocket transport.

---

## 3. Backend Hardening & BOLA / IDOR Defense (V3.2 Patch)

Located at `backend/server.js`:

1. **Server-Enforced Object Ownership**:
   - In V3.1, client-supplied `ownerId` parameters on `POST /api/sync` and `GET /api/sync/:ownerId` could allow authenticated User A to read or overwrite User B's encrypted backup.
   - In V3.2, the server strictly validates that `ownerId === req.user.id || ownerId === req.user.username`. Any cross-tenant access attempt returns a `403 Forbidden` with a security audit event log.
2. **Helmet Security Headers**: Strict Content-Security-Policy (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options: nosniff, and X-Frame-Options: DENY.
3. **CORS Whitelisting**: Restricted origin headers preventing cross-site scripting invocations.
4. **Rate Limiting**: Tiered IP-based rate limiting (100 requests per 15-minute window for sync endpoints; 20 requests per minute for AI analysis proxies).
5. **Input Sanitization & Schema Validation**:
   - Strict array checks on holding collections.
   - Numerical bounds validation preventing negative valuation exploits or division by zero.
   - Nonce validation preventing replay attacks.
6. **Session Management**: Cryptographically signed JWT tokens with rolling expiration.

---

## 4. Privacy & Regulatory Alignment

- **DPDP-Aligned Privacy Controls**: Client-side PII redactor removes all identifiers (Aadhaar 12-digit numbers, PAN, bank accounts, IFSC codes, names, phones, emails) prior to external LLM calls.
- **Suitability-Support Infrastructure**: Audit trails, risk profiling records, and transaction logs are timestamped and preserved with immutable local revision histories to support regulatory due diligence.
- **OWASP Mobile & Top 10**: Defense against SQL/NoSQL injection, broken object-level authorization (BOLA), and broken authentication.
