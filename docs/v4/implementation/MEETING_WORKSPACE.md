# AssetArray V4.0 — Phase 3: Meeting Workspace & Follow-Up Workflows

## Meeting Workspace Lifecycle
The meeting lifecycle guides advisors through client interactions in 3 distinct stages:

```
SCHEDULED ──→ IN_PROGRESS ──→ COMPLETED
     │              │
     └──→ CANCELLED └──→ CANCELLED
```

### 1. Pre-Meeting Stage
Generates a consolidated client snapshot before meeting commencement:
- Client Overview & Household Context
- Open Action Items & Alerts Count
- Portfolio Drift Exceptions
- Tax Loss Harvesting Opportunities
- Goals Needing Review

### 2. Live Meeting Stage
- Interactive agenda tracking
- Timestamped meeting notes captured with author attribution
- Live fiduciary decision recording

### 3. Post-Meeting Stage
- Meeting completion automatically transitions status to `COMPLETED` and records `endedAt`.
- Automated follow-up task generation: creates linked `MEETING_FOLLOW_UP` tasks with specified due dates and priorities.
- Immutable completion state: prevents duplicate completions and rejects post-completion note pollution.
