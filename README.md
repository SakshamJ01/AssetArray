# Asset Array

`Asset Array` is a polished Expo React Native mobile app for private client management in an advisory or relationship-driven market workflow.

It gives you:

- a secure PIN lock with optional biometric unlock
- a professional mobile dashboard for client records
- client categories, priority levels, and reminder tracking
- per-client portfolio management with editable and renameable holdings
- unified portfolio analytics across all tracked client holdings with allocation, gain/loss, winners, laggards, and risk flags
- built-in cash flow calculator for monthly, quarterly, yearly, and cumulative interest projection
- built-in SIP calculator for invested amount, returns, installments, and maturity projection
- calculator hub with cash flow, SIP, goal planner, and retirement tools in one place
- search and filter tools for daily follow-up work
- AI-style market brief, client message drafts, segmentation snapshot, automation queue, and report studio
- goal center for target planning and progress tracking
- secure advisor portal and remote collaboration workflows
- automated data aggregation snapshot for connected financial accounts
- tax optimization snapshot and reporting review layer
- one-to-one market update sharing by phone, SMS, email, or WhatsApp
- multi-select bulk campaign flow for sending one-click backend notifications to selected clients
- encrypted cloud backup support through the included backend
- first-pass dark mode toggle for the workspace shell

## Mobile app stack

- Expo React Native
- `expo-secure-store` for protected local device storage
- `expo-local-authentication` for biometrics
- `crypto-js` for client-side encryption before cloud sync

## Project structure

- [App.tsx](C:\Users\Saksham\Documents\New project\App.tsx): mobile app UI and workflow
- [src/services/secureSync.ts](C:\Users\Saksham\Documents\New project\src\services\secureSync.ts): encryption and sync helpers
- [backend/server.js](C:\Users\Saksham\Documents\New project\backend\server.js): encrypted backup API and bulk campaign endpoint
- [backend/package.json](C:\Users\Saksham\Documents\New project\backend\package.json): backend dependencies

## Run the mobile app

```bash
npm install
npx expo start
```

## Run the encrypted backend

In a second terminal:

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:4000` by default.

## Connect the app to the backend

1. Open `Asset Array`.
2. Unlock the app.
3. Open `Security and sync`.
4. Tap `Configure`.
5. Enter the backend URL.

If you are using a physical phone, replace `localhost` with your computer's local IP address, for example `http://192.168.1.10:4000`.

## New workflow highlights

- Use `Portfolio manager` inside a selected client to add, rename, edit, or remove holdings.
- Use `Unified portfolio view & analytics` to review total portfolio health across all tracked clients.
- Use the `Select` buttons in the client list to choose many clients at once.
- Open `Broadcast Center` to send one bulk campaign to all selected clients in a single action.

## Important security note

The backend stores only encrypted payloads from the app. Decryption happens on-device using your PIN-derived key. For production use, the next step would be deploying the backend behind HTTPS and replacing the file store with a managed database.
