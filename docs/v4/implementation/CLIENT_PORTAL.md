# AssetArray V4.0 — Investor Portal Architecture

## 1. Overview & Identity Model
The AssetArray Investor Portal provides authenticated clients and family office principals with a calm, institutional-grade view of their wealth, performance, goals, approved reports, documents, and outstanding action items.

- **Authentication Separation**: Client portal sessions are authenticated under client-scoped credentials and JWT tokens, completely separate from advisor workstation credentials.
- **Client-Safe Boundaries**: All API responses are pre-filtered on the server (`ClientSafeFilter`). No advisor diagnostic data, unassigned notes, custody breaks, or internal audit traces are transmitted to client devices.
- **Data Freshness Disclosure**: All metrics explicitly display their valuation as-of timestamp (e.g. `As of 17 Sep 2026`) and data source provenance.

## 2. Core Portal Sections
1. **Portfolio Overview**:
   - Total Net Worth / AUM across authorized client accounts.
   - Asset Allocation breakdown across Equity, Fixed Income, Cash & Equivalents, Alternatives.
   - Top Holdings with portfolio weightings and current valuations.
   - Deterministic TWR Performance Summary (1M, 3M, 1Y, 3Y, Since Inception).
2. **Strategic Goals**:
   - Long-term goal tracking (Retirement, Family Foundation, Real Estate, Education).
   - Target vs. current value, target year, on-track status, and Monte Carlo fundedness probability.
3. **Approved Reports**:
   - Access to versioned PDF and Web preview snapshots of `CLIENT_REVIEW_REPORT` and `MEETING_FOLLOW_UP_PACK`.
   - Immutable historical archive.
4. **Documents**:
   - Fiduciary agreements, quarterly custodial statements, tax packs.
   - Download tokens protected with client-specific verification.
5. **Action Items & Messaging**:
   - Client acknowledgement workflows: `REVIEW_DOCUMENT`, `CONFIRM_MEETING_ITEM`, `RESPOND_TO_REQUEST`, `REVIEW_REPORT`.
   - Zero autonomous financial execution; client responses are recorded as verified workflow records for advisor review.

## 3. Portal Endpoints (`/api/v4/portal`)
- `GET /api/v4/portal/overview`: Fetches client profile, portfolio metrics, goals, published reports, documents, and pending action items.
- `POST /api/v4/portal/action-items/:actionId/respond`: Records a client response or acknowledgement for an action item.
