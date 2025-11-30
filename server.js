// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const invoiceStore = new Map();
const BASE_URL = "http://localhost:4000"; // RESTORED BASE_URL

// --- HELPER: GENERATE PROFESSIONAL HTML DOCUMENT ---
const generateDocumentHtml = (doc, approveUrl, rejectUrl) => {
    // 1. GOOD VIEWING COLOURS: New, high-contrast colors
    const currencySymbol = doc.currency === "USD" ? "$" : doc.currency === "INR" ? "₹" : doc.currency === "EUR" ? "€" : "₳";
    const accentColor = doc.docType === "QUOTE" ? "#2563eb" : "#059669"; // NEW accent colors: deep blue/emerald green
    const mainTextColor = "#18181b"; // NEW high-contrast charcoal color

    // 2. REMOVE BUTTONS & ADD CARDANO ETERNL WALLET LINK
    const walletLinkUrl = "https://eternl.io/";
    const actionBlock = `
        <div style="margin-top: 40px; text-align: center;">
            <a href="${walletLinkUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; background-color: ${accentColor}; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 5px;" target="_blank">
                Open Cardano Eternl Wallet
            </a>
            <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">Use this link to easily open your wallet for payment.</p>
        </div>
    `;

    // Updated itemRows: changed text color to mainTextColor (#18181b) and aligned Qty right.
    const itemRows = doc.items.map(item => {
        const linePrice = item.qty * item.price;
        const lineTax = linePrice * (item.taxRate / 100);
        const lineTotal = linePrice + lineTax;
        return `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: ${mainTextColor};">${item.desc}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right; color: ${mainTextColor};">${item.qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right; color: ${mainTextColor};">${currencySymbol} ${item.price.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; text-align: right; color: ${accentColor};">${currencySymbol} ${lineTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const subtotal = doc.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const taxAmount = doc.total - subtotal;
    
    // Buttons now use the passed HTTP URLs for server logging
    return `
        <div style="font-family: Arial, sans-serif; background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; max-width: 600px; margin: auto; border-radius: 8px;">
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                    <td style="color: ${accentColor}; font-size: 24px; font-weight: bold;">Blue Dot</td>
                    <td style="text-align: right;">
                        <span style="font-size: 18px; color: #4b5563; font-weight: 600;">${doc.docType.toUpperCase()} #${doc.id}</span><br>
                        <span style="font-size: 12px; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</span>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
                <tr>
                    <td style="width: 50%;">
                        <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 5px;">Bill To</span>
                        <p style="margin: 0; font-size: 14px; color: ${mainTextColor}; font-weight: 600;">${doc.customerName}</p>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${doc.customerEmail}</p>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${doc.billingAddr.replace(/\n/g, ', ')}</p>
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 5px;">Merchant Cardano Address</span>
                        <p style="margin: 0; font-size: 12px; color: #4b5563; word-break: break-all;">${doc.merchantAddress}</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px; text-align: left; font-size: 12px; color: #4b5563; text-transform: uppercase;">Description</th>
                        <th style="padding: 10px; text-align: right; font-size: 12px; color: #4b5563; text-transform: uppercase; width: 50px;">Qty</th>
                        <th style="padding: 10px; text-align: right; font-size: 12px; color: #4b5563; text-transform: uppercase; width: 80px;">Unit Price</th>
                        <th style="padding: 10px; text-align: right; font-size: 12px; color: #4b5563; text-transform: uppercase; width: 80px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 5px;">Terms & Conditions</span>
                        <p style="margin: 0; font-size: 11px; color: #6b7280; border-left: 2px solid #e5e7eb; padding-left: 10px; white-space: pre-wrap;">${doc.termsAndConditions}</p>
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <p style="font-size: 14px; color: #4b5563; margin: 5px 0;">Subtotal: <span style="font-weight: 600; margin-left: 10px;">${currencySymbol} ${subtotal.toFixed(2)}</span></p>
                        <p style="font-size: 14px; color: #4b5563; margin: 5px 0;">Tax Amount: <span style="font-weight: 600; margin-left: 10px;">${currencySymbol} ${taxAmount.toFixed(2)}</span></p>
                        <p style="font-size: 18px; color: ${mainTextColor}; margin: 15px 0 0 0; padding-top: 10px; border-top: 1px solid #d1d5db; font-weight: bold;">GRAND TOTAL: <span style="color: ${accentColor}; margin-left: 10px;">${currencySymbol} ${doc.total.toFixed(2)}</span></p>
                        <p style="font-size: 14px; color: ${accentColor}; margin: 5px 0 0 0; font-weight: bold;">CARDANO PAY (ADA): <span style="font-size: 16px;">${doc.amountADA} ₳</span></p>
                    </td>
                </tr>
            </table>

            ${actionBlock}
            
            <p style="font-size: 10px; color: #9ca3af; text-align: center; margin-top: 20px; word-break: break-all;">
                This document was generated by Blue Dot.
            </p>
        </div>
    `;
};


// Send document email
app.post("/api/send-document-email", async (req, res) => {
    try {
        const { smtpUser, smtpPass, doc } = req.body;
        if (!smtpUser || !smtpPass || !doc) {
            return res.status(400).json({ error: "smtpUser, smtpPass and doc are required" });
        }

        const stored = { ...doc, clientDecision: doc.clientDecision || null };
        invoiceStore.set(doc.id, stored);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: { user: smtpUser, pass: smtpPass },
        });

        // HTTP DECISION URLS - still generated but no longer linked in email
        const approveUrl = `${BASE_URL}/api/invoices/${encodeURIComponent(doc.id)}/decision?decision=APPROVED`;
        const rejectUrl = `${BASE_URL}/api/invoices/${encodeURIComponent(doc.id)}/decision?decision=REJECTED`;

        const documentHtml = generateDocumentHtml(doc, approveUrl, rejectUrl); 
        
        // Updated Subject Line to use the new doc.id format
        const subject = `${doc.docType} from Blue Dot (Action Required) - ${doc.id}`; 
        
        const plainSummary = `${doc.docType} total: ${doc.currency} ${doc.total.toFixed(2)}. Please view the document and use the link to open your wallet for payment.`;
        
        await transporter.sendMail({ 
            from: smtpUser, 
            to: doc.customerEmail, 
            subject, 
            text: plainSummary, 
            html: documentHtml, 
        });
        res.json({ ok: true });
    } catch (err) {
        console.error("Error sending document email:", err);
        res.status(500).json({ error: "Failed to send email" });
    }
});


// --- Client decision endpoint (NO LONGER ACCESSED FROM EMAIL) ---
app.get("/api/invoices/:id/decision", (req, res) => {
    const id = req.params.id;
    const decisionParam = (req.query.decision || "").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(decisionParam)) {
        return res.status(400).send("Invalid decision. Use APPROVED or REJECTED only.");
    }

    const invoice = invoiceStore.get(id);
    if (!invoice) return res.status(404).send("Invoice not found. Maybe the link is old or incorrect.");

    invoice.clientDecision = decisionParam;
    invoiceStore.set(id, invoice);

    let responseTitle = "";
    let responseBody = "";

    if (decisionParam === "APPROVED") {
        responseTitle = `✅ Approved ${id}`;
        responseBody = `<h2 style="color: #16a34a;">✅ Quote Approved!</h2><p style="font-size: 16px;">You have successfully **APPROVED** ${invoice.docType.toLowerCase()} **${id}**.</p><p>The merchant has been notified and the status has been logged in the Copilot app.</p>`;
    } else if (decisionParam === "REJECTED") {
        responseTitle = `❌ Rejected ${id}`;
        responseBody = `<h2 style="color: #dc2626;">❌ Quote Rejected</h2><p style="font-size: 16px;">The decision to **REJECT** ${invoice.docType.toLowerCase()} **${id}** has been recorded.</p><p>For comments or discussion, please simply **REPLY to the original email**.</p>`;
    }

    res.send(`
        <html>
            <head><title>${responseTitle}</title></head>
            <body style="font-family: system-ui; padding: 24px; max-width: 600px; margin: auto; background: #f9fafb;">
                <div style="text-align: center;">${responseBody}</div>
                <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">You can now close this tab.</p>
            </body>
        </html>
    `);
});

// Get invoice status (Kept for frontend polling/status checking)
app.get("/api/invoices/:id", (req, res) => {
    const invoice = invoiceStore.get(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(invoice);
});

// Root route
app.get("/", (req, res) => {
    res.send("BlueDot backend running. Try POST /api/send-document-email");
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));