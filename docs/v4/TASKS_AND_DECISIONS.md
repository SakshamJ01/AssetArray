# ASSETARRAY 4.0 — TASKS, DECISIONS & MEETING WORKSPACE
**Institutional Advisor Platform Product Blueprint**

---

## 1. First-Class Task & Decision Engine

In AssetArray 4.0, tasks are not disconnected to-do list checkboxes. Every task is directly anchored to a **Client**, **Portfolio**, **Decision Record**, or **Compliance Requirement**.

```
+----------------------------------------------------------------------------------------------------+
| TASK LIFECYCLE & STRUCTURAL ANATOMY                                                                |
+----------------------------------------------------------------------------------------------------+
| Field               | Description & Example                                                        |
+---------------------+------------------------------------------------------------------------------+
| Task ID             | TSK-2026-0891                                                                |
| Title               | "Execute March Sec 70 Tax-Loss Harvesting for Vikram Malhotra"              |
| Priority            | URGENT / HIGH / MEDIUM / LOW                                                 |
| Category            | REBALANCE / TAX_HARVEST / MEETING_FOLLOWUP / COMPLIANCE / KYC                 |
| Linked Entity       | Client: Vikram Malhotra | Portfolio: Individual Demat (ACC-8921)            |
| Assignee            | Priya Sharma (Associate RM) | Approver: Rajan Mehta (Principal)             |
| Due Date            | 25 March 2026 15:00 IST                                                      |
| Status              | PENDING_APPROVAL -> IN_PROGRESS -> COMPLETED -> AUDITED                      |
| Attached Evidence   | Drafted Rebalance Order Slip (PDF) + Sec 70 Capital Gains Computation JSON    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Institutional Audit Trail: Recording the "Why"

To satisfy both internal governance and regulatory scrutiny, AssetArray 4.0 captures an immutable decision log:

```
+-------------------------------------------------------------------------------+
| IMMUTABLE DECISION AUDIT RECORD                                               |
+-------------------------------------------------------------------------------+
| WHO:       Rajan Mehta (Senior Advisor ID: ADV-012)                           |
| WHAT:      Approved Asset Allocation Mandate Waiver (Equity permitted at 75%) |
| WHEN:      12 Feb 2026 11:42:15 IST (NTP Timestamped)                         |
| WHY:       "Client requested temporary equity overweight to capture Q4 rally; |
|            agreed to de-risk back to 65% target in April 2026."               |
| EVIDENCE:  Signed Meeting Minutes Memo (DOC-2026-441.pdf)                      |
| BEFORE:    Mandate Upper Corridor Cap = 70.0%                                 |
| AFTER:     Mandate Temporary Cap = 75.0% (Valid until 30 April 2026)          |
+-------------------------------------------------------------------------------+
```

---

## 3. Dedicated Client Meeting Workspace

The Client Meeting Workspace provides a dedicated, high-focus interface for the 3 stages of a high-stakes client interaction:

```
+-------------------------------------------------------------------------------+
| THE THREE-STAGE MEETING WORKSPACE                                             |
+-------------------------------------------------------------------------------+
| STAGE 1: PRE-MEETING BRIEFING (Advisor Desktop / Mobile - 10 Mins Before)      |
| • 1-page condensed brief: Net Worth, YTD Alpha, Drift Alerts, Open Tax Opps.  |
| • AI Copilot drafts 3 talking points and flags pending approvals.             |
|                                                                               |
| STAGE 2: LIVE MEETING MODE (Client-Safe Presentation Canvas)                  |
| • High-contrast, clean visual layout suitable for iPad or Zoom screen-share.  |
| • Masks internal fee margins, ops tasks, and compliance flags.                |
| • Interactive Simulation Sliders for real-time "What If" discussions.        |
| • Live Decision Logger: Instantly capture client agreements during call.      |
|                                                                               |
| STAGE 3: POST-MEETING EXECUTION & FOLLOW-UP (Immediately Post-Call)           |
| • 1-Click AI draft of client confirmation email and WhatsApp summary.         |
| • Auto-creates back-office trade staging tasks in Ops queue.                 |
| • Dispatches digitally stamped meeting summary to Client Portal.              |
+-------------------------------------------------------------------------------+
```

---

## 4. Controlled Client Communication Pipeline

To prevent unauthorized or unvetted advice from being sent to clients:
```
[Advisor / AI Drafts Communication]
                |
                v
[Review & Edit Screen (Advisor adjusts phrasing)]
                |
                v
[Senior Advisor Sign-Off (If policy requires)]
                |
                v
[Dispatch via Firm SMTP / Official WhatsApp API]
                |
                v
[Immutable Copy Archived to Client 360 Communication Timeline]
```
