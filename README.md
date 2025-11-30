## 📄 README.md: Blue Dot Copilot - Cardano PayLink Invoice/Quote Agent

This project is a modern, full-stack application demonstrating an AI-powered **Blue Dot Copilot** for merchants to instantly generate, send, and manage Cardano-based invoices and quotes. It is built on a React frontend and a Node.js (Express) backend, showcasing key agentic features like **Masumi Agent Monetization** and **Real-Time Client Decision Polling**.

-----

### 🌟 Key Features

The application simulates an **AI Agentic Service** that performs core business tasks.

| Feature | Description | File(s) |
| :--- | :--- | :--- |
| **Masumi Agent Monetization** | Simulates a successful **0.1 ADA** on-chain payment to the Copilot upon every agent invocation (e.g., when a form is requested). | `CardanoInvoiceApp.jsx` |
| **AI Intent Recognition** | The Copilot Chat automatically detects intent (e.g., "create **quote**" or "send **invoice**") and triggers the correct form. | `CardanoInvoiceApp.jsx` |
| **Real-Time Polling** | Automatically polls the backend every 5 seconds for quotes to check the client's decision (**APPROVED/REJECTED**) and updates the chat UI live. | `CardanoInvoiceApp.jsx`, `server.js` |
| **Cardano PayLinks** | Generated documents include a `web+cardano:` deep link for one-click payment via compatible Cardano wallets (e.g., Eternl). | `server.js` |
| **Full-Stack Document Flow** | Generates professional, branded HTML documents and sends them to the client via a configured SMTP service. | `server.js` |

### 🚀 Getting Started

Follow these steps to set up and run the application locally.

#### Prerequisites

  * **Node.js** (v18 or higher)
  * **npm** or **yarn**

### 1\. Backend Setup (`server.js`)

The backend is an Express server responsible for document generation, sending emails, and handling client approval links.

1.  **Navigate to the backend directory** (where `server.js` is located).
2.  **Install dependencies:**
    ```bash
    npm install express cors body-parser nodemailer
    # OR
    yarn add express cors body-parser nodemailer
    ```
3.  **Configure Environment Variables:**
      * The server uses `nodemailer` to send emails. You need to set up credentials for an SMTP service (e.g., Gmail, SendGrid).
      * Create a `.env` file or export the following variables in your terminal:

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `SMTP_USER` | Email address used to send the document. | `your_email@gmail.com` |
| `SMTP_PASS` | App password or API key for the SMTP server. | `your_app_password` |
| `BASE_URL` | The public URL for the server. **Must be `http://localhost:4000` for local testing.** | `http://localhost:4000` |

4.  **Run the server:**
    ```bash
    node server.js
    ```
    The server will run on `http://localhost:4000`.

### 2\. Frontend Setup (React App)

The frontend is the main user interface and Copilot chat experience.

1.  **Navigate to the root directory** (where `package.json` is located).
2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # OR
    yarn dev
    ```
    The app will typically open at `http://localhost:5173`.

-----

### 💡 Usage and Demo Credentials

1.  **Access the App:** Open your browser to the local frontend URL (`http://localhost:5173`).
2.  **Log In:** Use the demo credentials provided in the application:
      * **Demo Username:** `merchant`
      * **Demo Password:** `cardano123`
3.  **Configure Email:** Go to the **Profile** tab and enter your **Sender Email** (`SMTP_USER`) and **App Password** (`SMTP_PASS`) to enable the **"Send via Email"** functionality.
4.  **Use the Copilot:**
      * Go to the **Copilot Chat** tab.
      * Click a Quick Action (e.g., **Create Quote**), or type a command like "I need a new invoice."
      * Observe the **"Masumi Agent Invocation"** system alert showing the simulated **0.1 ADA payment**.
      * Fill out and submit the generated form.
5.  **Test Payment Flow:**
      * Send the **Quote** or **Invoice** to an email address you can access.
      * Open the email and click the **Pay Invoice** button to test the Cardano PayLink.

-----

### 🌐 Deployment Notes

This architecture is ready to be deployed to any cloud environment (e.g., Railway, Heroku, or Vercel/Netlify for the frontend).

For full integration with the **Masumi Network** and the **Kodosumi** agent runtime, the AI agent logic should be factored into a separate service and integrated with the official **Masumi Payment Service** to replace the current `mockMasumiMonetization` function with actual on-chain transaction calls.