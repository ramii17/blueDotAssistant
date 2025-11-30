# PayNow Button & Cardano PayLink Guide

## Overview

The **PayNow Button** is an interactive button that appears in invoice emails sent to clients. When clicked, it uses the **Cardano PayLink protocol** (`web+cardano://`) to open the client's Cardano wallet and pre-fill the payment details, allowing them to instantly pay your invoice.

---

## How It Works

### 1. **Invoice Generation**
- You create an invoice in Blue Dot
- Enter your merchant address (manually or via Eternl wallet connection)
- Enter the ADA amount due

### 2. **Email Sending**
- When you send the invoice via email
- Backend generates a **PayLink** using the format:
  ```
  web+cardano:{YOUR_ADDRESS}?amount={AMOUNT_IN_ADA}
  ```
- Example: `web+cardano:addr1qx2y3z...k9z?amount=50`

### 3. **Client Receives Email**
- Client opens invoice email
- Sees a prominent **"PAY NOW (50 ₳)"** button
- Also sees your merchant address for manual payment if needed

### 4. **Client Clicks PayNow**
- Button click triggers the PayLink protocol
- Opens their installed Cardano wallet (Eternl, Yoroi, Lace, etc.)
- Wallet pre-fills:
  - **Recipient Address**: Your merchant address
  - **Amount**: The exact ADA amount due
- Client reviews and confirms payment

### 5. **Payment Completes**
- Client clicks "Send" in their wallet
- Transaction is broadcast to Cardano blockchain
- ADA arrives in your wallet (usually within seconds)

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. You Create Invoice                                      │
│     ✓ Items, amounts, client email                          │
│     ✓ Enter merchant address (or connect Eternl wallet)     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  2. You Click "Send Email"                                  │
│     ✓ Blue Dot calculates ADA amount                        │
│     ✓ Server generates PayLink                              │
│     ✓ Email sent with PayNow button                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Client Receives Email                                   │
│     [Invoice Details]                                       │
│     Total Due: $500 (50 ADA)                                │
│     ┌────────────────────────────────────┐                  │
│     │  💰  PAY NOW (50 ₳)  [GREEN BUTTON]│                  │
│     └────────────────────────────────────┘                  │
│     Your Address: addr1qx2y3z...k9z                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Client Clicks PayNow Button                             │
│     Browser triggers PayLink protocol                       │
│     └─ Cardano wallet opens with pre-filled details         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Eternl Wallet Opens (or Yoroi/Lace/etc)                 │
│     From: Client's Address                                  │
│     To:   addr1qx2y3z...k9z (YOUR ADDRESS)                  │
│     Amount: 50 ADA                                          │
│     ┌────────────────────────────────────┐                  │
│     │  [Review]  [Confirm]  [Send] ✓     │                  │
│     └────────────────────────────────────┘                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Payment Complete ✅                                      │
│     Transaction broadcast to blockchain                     │
│     ADA arrives in your wallet                              │
│     Invoice status updates to "PAID"                        │
└─────────────────────────────────────────────────────────────┘
```

---

## PayLink Format

### Structure
```
web+cardano:{address}?amount={amountInADA}
```

### Components

| Part | Description | Example |
|------|-------------|---------|
| `web+cardano:` | Protocol handler | `web+cardano:` |
| `{address}` | Your merchant Cardano address | `addr1qx2y3z...k9z` |
| `?amount=` | ADA amount parameter | `?amount=50` |
| `{amountInADA}` | Exact ADA owed (calculated from invoice total) | `50` |

### Full Example
```
web+cardano:addr1qy2x3k9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3@f0?amount=50.5
```

---

## Email Template

The invoice email includes:

```html
┌────────────────────────────────────────────────┐
│               BLUE DOT INVOICE                 │
│              Invoice #12/25-26                 │
├────────────────────────────────────────────────┤
│ Bill To: Acme Corp                             │
│ Items: Cardano DApp Development (1x) $500      │
├────────────────────────────────────────────────┤
│ Subtotal:        $500.00                       │
│ Tax:             $0.00                         │
│ TOTAL:           $500.00                       │
│ ADA TO PAY:      50 ₳                          │
├────────────────────────────────────────────────┤
│     ┌──────────────────────────────┐           │
│     │  💳 PAY NOW (50 ₳)           │◄── Button │
│     └──────────────────────────────┘           │
│                                                │
│ Your Address: addr1qx2y3z...k9z               │
├────────────────────────────────────────────────┤
│ Terms & Conditions: Payment due within 30 days │
└────────────────────────────────────────────────┘
```

---

## Supported Wallets

The `web+cardano://` protocol works with **CIP-30 compliant** Cardano wallets:

✅ **Eternl** (Recommended for Blue Dot)
✅ **Yoroi** (Emurgo)
✅ **Lace** (Cardano Foundation)
✅ **Nami** (Community)
✅ **Flint** (Minswap)

When a client clicks PayNow:
1. Browser checks if any wallet extension is installed
2. Opens the installed wallet's interface
3. Pre-fills payment details
4. Wallet handles the transaction

---

## Step-by-Step: Using PayNow

### From Merchant Perspective (You)

1. **Log into Blue Dot**
   - Username: `merchant`
   - Password: `cardano123`

2. **Connect Your Eternl Wallet** (Optional but recommended)
   - Go to **Profile** tab
   - Click **"Connect Eternl Wallet"**
   - Approve in wallet popup
   - Your address auto-fills

3. **Create an Invoice**
   - Chat: "Create an invoice"
   - Or use Quick Actions button
   - Fill in client details (name, email, address)
   - Add line items (description, qty, price, tax%)
   - Review total ADA amount

4. **Send to Client**
   - Click **"Send Email"** on invoice card
   - System confirms email sent with PayNow link

5. **Receive Payment**
   - Client gets email with PayNow button
   - They click it
   - ADA arrives in your wallet

---

### From Client Perspective (Them)

1. **Receive Email**
   - Client opens invoice email from you
   - Sees invoice details and total in ADA

2. **Click PayNow Button**
   - Reads the amount: "50 ₳"
   - Clicks the green **"PAY NOW (50 ₳)"** button

3. **Wallet Opens**
   - Their Eternl/Yoroi/Lace wallet opens
   - Pre-filled with:
     - Your address (auto-filled)
     - Amount: 50 ADA (auto-filled)
     - Fee calculated automatically

4. **Confirm & Send**
   - Client reviews payment details
   - Clicks "Confirm" or "Send"
   - Wallet handles transaction
   - Payment appears on-chain within seconds

5. **Done!**
   - Money in your wallet
   - Invoice marked as PAID
   - Client gets receipt

---

## PayLink Examples

### Invoice for Web Development (50 ADA)
```
web+cardano:addr1qx2y3z9w8x7y6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2@f0?amount=50
```

### Invoice for Consulting (125.5 ADA)
```
web+cardano:addr1qy9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4i3h2g1f0e9d8c7b6a5z4y3x2w1@f0?amount=125.5
```

### Invoice for Design (7.25 ADA)
```
web+cardano:addr1qz8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3z2y1x0@f0?amount=7.25
```

---

## Troubleshooting

### "PayNow button not appearing in email"

**Reason**: Merchant address was not set when sending invoice

**Solution**:
1. Go to Profile tab
2. Connect Eternl wallet OR manually enter address
3. Recreate and resend invoice
4. Check spam folder for email

---

### "Clicking PayNow doesn't open wallet"

**Reason**: No Cardano wallet installed, or wrong protocol handler

**Solution**:
1. Ensure wallet (Eternl, Yoroi, etc.) is installed
2. Browser must have `web+cardano://` protocol handler registered (done by wallet)
3. Try copying the PayLink and pasting into address bar manually
4. Check wallet extension is enabled in browser

---

### "Wrong amount showing in wallet"

**Reason**: Invoice total was incorrectly calculated

**Solution**:
1. Verify invoice items and quantities
2. Check tax percentages
3. Recreate invoice with correct amounts
4. Amount in ADA is calculated from total at time of sending

---

### "Client paid but invoice shows unpaid"

**Reason**: System hasn't synced with blockchain yet, or manual update needed

**Solution**:
1. Wait 5-10 seconds for blockchain confirmation
2. Refresh the page
3. Check **Receipts** tab for transaction
4. Manually mark as paid if needed
5. Check blockchain explorer (Cardanoscan) for transaction hash

---

## Security & Privacy

### What Blue Dot Can See

✅ The merchant address (you provide it)
✅ The amount to pay (calculated from invoice)
✅ Transaction confirmation emails
✅ Invoice status history

### What Blue Dot CANNOT See

❌ Client's private keys (stays in wallet)
❌ Client's wallet balance
❌ Client's transaction history
❌ Payment confirmation (on-chain only)

### Best Practices

1. **Use connected Eternl wallet** for automatic address management
2. **Verify recipient address** before sending invoice
3. **Keep your wallet seed phrase safe** (not stored in Blue Dot)
4. **Enable 2FA** on email account for security
5. **Test with small amounts first** before production use

---

## FAQ

**Q: Can clients pay without a wallet installed?**
A: No, they need a Cardano wallet. But they can copy/paste your address for manual payment.

**Q: What if client is on mobile?**
A: PayLink works with mobile wallet apps (Eternl, Yoroi mobile). Same process.

**Q: Can I send invoice without connecting wallet?**
A: Yes! Manually enter your address in Profile settings.

**Q: What if amount is wrong?**
A: Recreate the invoice with correct amounts and send a new email.

**Q: How do I get paid in fiat instead of ADA?**
A: Convert ADA to fiat on exchange (Kraken, Coinbase, etc.) after receiving payment.

**Q: Can client see my other transactions?**
A: No, they only see the address. All transactions on-chain are public but anonymous by default.

**Q: What if they send wrong amount?**
A: Contact them through original email. On-chain, only send what's needed.

**Q: Is there a refund system?**
A: Not built-in. Manual refund must be sent from your wallet.

---

## Network Reference

### Mainnet (Live ADA)
- Prefix: `addr1qx...` (mainnet addresses)
- PayLink: `web+cardano:addr1qx...?amount=X`
- Real ADA transfers

### Testnet (Testnet ADA - FREE)
- Prefix: `addr_test1q...` (testnet addresses)
- PayLink: `web+cardano:addr_test1q...?amount=X`
- No real value, for testing

---

## Next Steps

1. ✅ Connect your Eternl wallet in Profile
2. ✅ Create a test invoice
3. ✅ Send to yourself or team member
4. ✅ Test the PayNow button
5. ✅ Verify payment arrives in wallet

**You're ready to accept Cardano payments! 🚀**

---

**Last Updated**: November 30, 2025
**For**: Blue Dot Assistant v1.0
