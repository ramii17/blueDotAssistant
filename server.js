// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

// -------- CONFIG --------
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // your Vite dev URL
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// In-memory store for invoices / quotes
// Key: docId (e.g. "01/25-26"), Value: doc object + clientDecision
const invoicesStore = new Map();

// -------- MIDDLEWARE --------
app.use(
  cors({
    origin: FRONTEND_URL.split(","),
  })
);
app.use(bodyParser.json());

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "BlueDot backend running" });
});

/**
 * POST /api/send-document-email
 * Body: { smtpUser, smtpPass, doc }
 *
 * - Sends email to client (doc.customerEmail)
 * - Saves doc in invoicesStore for later polling & approval
 */
app.post("/api/send-document-email", async (req, res) => {
  try {
    const { smtpUser, smtpPass, doc } = req.body;

    if (!smtpUser || !smtpPass) {
      return res
        .status(400)
        .json({ error: "Missing SMTP credentials (smtpUser, smtpPass)" });
    }
    if (!doc || !doc.id) {
      return res.status(400).json({ error: "Missing or invalid document" });
    }
    if (!doc.customerEmail) {
      return res.status(400).json({ error: "Document has no customerEmail" });
    }

    // Save / overwrite doc in store
    const storedDoc = {
      ...doc,
      clientDecision: doc.clientDecision || null,
      createdAt: new Date().toISOString(),
    };
    invoicesStore.set(doc.id, storedDoc);

    // IMPORTANT: doc.id contains "/" -> must be encoded in URLs
    const encodedId = encodeURIComponent(doc.id);

    // Approval + Rejection links for the client
    const approveUrl = `${BASE_URL}/api/invoices/${encodedId}/decision?decision=APPROVED`;
    const rejectUrl = `${BASE_URL}/api/invoices/${encodedId}/decision?decision=REJECTED`;

    // --- Nodemailer Transporter (Gmail App Password) ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subjectPrefix = doc.docType === "QUOTE" ? "Quote" : "Invoice";
    const mailOptions = {
      from: smtpUser,
      to: doc.customerEmail,
      subject: `${subjectPrefix} ${doc.id} from Blue Dot`,
      text: `
Hi ${doc.customerName || "there"},

You have a new ${doc.docType} from Blue Dot.

Amount: ${doc.currency} ${doc.total?.toFixed?.(2) || doc.total}
To be paid in ADA: ${doc.amountADA} ₳

Please review and choose an option:

Approve: ${approveUrl}
Reject: ${rejectUrl}

(These links update the merchant's dashboard in real-time.)

Thanks,
Blue Dot Copilot
      `,
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:14px; line-height:1.6;">
          <h2>New ${subjectPrefix} ${doc.id}</h2>
          <p>Hi <strong>${doc.customerName || "there"}</strong>,</p>
          <p>You have a new <strong>${doc.docType}</strong> from Blue Dot.</p>
          <ul>
            <li><strong>Amount:</strong> ${doc.currency} ${doc.total?.toFixed?.(2) || doc.total}</li>
            <li><strong>To be paid in ADA:</strong> ${doc.amountADA} ₳</li>
          </ul>
          <p>Please review and choose an option:</p>
          <p>
            <a href="${approveUrl}" style="display:inline-block;padding:8px 14px;margin-right:8px;border-radius:6px;background:#16a34a;color:white;text-decoration:none;font-weight:600;">
              ✅ Approve
            </a>
            <a href="${rejectUrl}" style="display:inline-block;padding:8px 14px;border-radius:6px;background:#dc2626;color:white;text-decoration:none;font-weight:600;">
              ❌ Reject
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:16px;">
            When you click one of the buttons above, the merchant's Blue Dot dashboard will update automatically.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Email sent via SMTP",
      invoiceId: doc.id,
    });
  } catch (err) {
    console.error("Error in /api/send-document-email:", err);
    return res
      .status(500)
      .json({ error: "Failed to send email", details: err.message });
  }
});

/**
 * GET /api/invoices/:id
 * Returns full invoice/quote with clientDecision so frontend can poll.
 * NOTE: :id is URL-encoded on the frontend; Express automatically decodes it.
 */
app.get("/api/invoices/:id", (req, res) => {
  const docId = req.params.id;
  const doc = invoicesStore.get(docId);
  if (!doc) {
    return res.status(404).json({ error: "Invoice not found" });
  }
  return res.json(doc);
});

/**
 * GET /api/invoices/:id/decision?decision=APPROVED|REJECTED
 * This is what the client hits from the email.
 */
app.get("/api/invoices/:id/decision", (req, res) => {
  const docId = req.params.id;
  const decisionRaw = (req.query.decision || "").toString().toUpperCase();

  if (!["APPROVED", "REJECTED"].includes(decisionRaw)) {
    return res
      .status(400)
      .send("<h2>Invalid decision. Use APPROVED or REJECTED.</h2>");
  }

  const doc = invoicesStore.get(docId);
  if (!doc) {
    return res.status(404).send("<h2>Invoice/Quote not found.</h2>");
  }

  doc.clientDecision = decisionRaw;
  doc.decisionAt = new Date().toISOString();
  invoicesStore.set(docId, doc);

  // Simple confirmation page for the client
  return res.send(`
    <html>
      <head>
        <title>Decision Recorded</title>
      </head>
      <body style="font-family: system-ui; text-align:center; padding:40px;">
        <h2>Thank you!</h2>
        <p>Your decision <strong>${decisionRaw}</strong> for document <strong>${docId}</strong> has been recorded.</p>
        <p>You can now close this tab.</p>
      </body>
    </html>
  `);
});

// -------- START SERVER --------
app.listen(PORT, () => {
  console.log(`BlueDot backend running on port ${PORT}`);
  console.log(`Frontend origin allowed: ${FRONTEND_URL}`);
  console.log(`Base URL for emails: ${BASE_URL}`);
});
