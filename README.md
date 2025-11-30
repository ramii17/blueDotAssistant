# BlueDot Assistant

BlueDot Assistant is a Vite + React front end paired with an Express email relay for drafting Cardano quotes/invoices, sending them to customers, and tracking approvals in real time.

## Features
- **Guided quote/invoice creation:** Chat prompts, quick actions, and auto intent detection kick off document forms with default values.
- **Fiscal-year document IDs:** New quotes/invoices are generated with sequential IDs that embed the fiscal year (e.g., `12/24-25`).
- **SMTP delivery with decision links:** The backend sends customer emails (Gmail app password supported) and embeds approve/reject links that feed back into the dashboard.
- **Live status polling:** The client polls `/api/invoices/:id` and updates in-memory receipts when customers act on emails.
- **Profile & credentials:** Demo login (`merchant` / `cardano123`) plus profile settings for SMTP creds and Cardano receiving address.
- **Receipts view:** Compact history of recent documents with ADA totals and status badges.

## Prerequisites
- Node.js 18+
- npm 9+
- Gmail app password (or compatible SMTP credentials) if you plan to email customers.

## Installation
```bash
npm install
```

## Environment configuration
Create a `.env` file at the project root to control backend URLs and CORS:
```env
# Express server
PORT=4000
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:4000
```

On the frontend, set the backend URL if it differs from the default:
```env
VITE_BACKEND_URL=http://localhost:4000
```

> `FRONTEND_URL` may be a comma-separated list of allowed origins when running multiple dev URLs.

## Running locally
In one terminal, start the backend email relay:
```bash
npm run start
```

In another terminal, start the Vite dev server:
```bash
npm run dev
```

Open http://localhost:5173 and log in with the demo credentials.

## Using the app
1. **Log in** with `merchant` / `cardano123` (no signup required).
2. **Generate a document** via quick actions or by typing “create invoice/quote.” Fill in line items, currency, and customer email.
3. **Send to client** using the **Send Email** action—this stores the doc in memory and dispatches an email with approve/reject buttons.
4. **Watch status** as the dashboard polls for the client’s decision and updates receipts accordingly.
5. **Update profile** to save SMTP username/app password and your Cardano receiving address.

## Notes & limitations
- Documents are stored in an in-memory map and are cleared on server restart.
- The Cardano PayLink action is intentionally disabled in the current build.
- Nodemailer is configured for Gmail by default; adjust the transporter in `server.js` for other providers.
