# Profile Workspace — User Profile & Access Status

User flow: View access status, scan stats, sign out.

## Scope

- **ProfileScreen** — User info, access badge, scan count, sign out button

## State Flow

- **Props from App.js:** `daysLeft`, `totalScans`
- **Local state:** `signingOut`, `signOutError`
- **Mutations:** Sign out via Supabase Auth
- **Updates:** Props come from App.js (hardcoded today, will read from `users` table later)

## Dependencies

- `../../_shared/constants` — COLORS
- `../../_shared/supabase` — Supabase auth client

## Rules

- Read-only display (except sign-out action)
- All state comes as props from App.js
- No cross-workspace communication
- Access status logic lives here (calculate daysLeft color styling, etc.)
