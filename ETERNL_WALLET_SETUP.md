# Cardano Eternl Wallet Integration Guide

## Overview

This Blue Dot Assistant now supports **Cardano Eternl Wallet** integration using the **CIP-30 standard**. This allows merchants to securely connect their Eternl wallet to automatically retrieve their Cardano payment address without manual entry.

## What is Eternl Wallet?

**Eternl** is a browser-based wallet for the Cardano blockchain. It supports:
- Multi-asset management (ADA, tokens, NFTs)
- CIP-30 standard for dApp integration
- Safe key management with browser extension security
- Full Cardano network support (Mainnet, Testnet, Preview, Preprod)

**Download**: https://eternl.io

---

## Installation & Setup

### 1. Install Eternl Browser Extension

1. Visit **https://eternl.io**
2. Download the extension for your browser (Chrome, Firefox, Edge, Safari)
3. Follow the installation prompts
4. Create or import your Cardano wallet into Eternl
5. Set a secure password

### 2. Ensure You Have ADA in Your Wallet

- Receive ADA from an exchange or faucet
- Minimum recommended: 2-5 ADA (for transaction fees)
- For testnet: Use the [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

### 3. Start the Blue Dot Application

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` (default Vite port) and the backend on `http://localhost:4000`.

---

## Using Eternl Wallet in Blue Dot

### Step 1: Navigate to Profile Settings

1. Open the application in your browser
2. Log in with demo credentials:
   - **Username**: `merchant`
   - **Password**: `cardano123`
3. Click the **Profile** tab in the left sidebar

### Step 2: Connect Your Eternl Wallet

1. In the "Cardano Eternl Wallet (CIP-30)" section, click **Connect Eternl Wallet**
2. A **wallet popup** will appear (from the Eternl extension)
3. Review the connection request and click **Approve**
4. Your wallet address will be automatically retrieved and displayed
5. The receiving address field will be **auto-filled**

### Step 3: Save Settings

1. Click **Save Settings** to persist your wallet connection
2. A success message will confirm the wallet is connected

---

## Features

### ✅ Wallet Connection (CIP-30)

- **Secure**: Uses browser extension security model
- **Non-custodial**: Your private keys stay in Eternl, never sent to Blue Dot
- **One-click**: Single button to connect
- **Read-only**: Blue Dot only reads addresses and metadata (no transaction signing yet)

### ✅ Auto-filled Receiving Address

- When you connect Eternl, your primary Cardano address is automatically retrieved
- This address is used for all incoming payments
- You can manually override it if needed

### ✅ Wallet Status Display

- See your connected wallet name (e.g., "Eternl Wallet")
- View your full Cardano address
- Easy disconnect option

### ✅ Network Support

Currently configured for:
- **Mainnet** (default): Live Cardano network with real ADA
- You can modify the network in Eternl settings (Testnet, Preview, Preprod)

---

## Technical Details

### CIP-30 Standard

CIP-30 (Cardano Improvement Proposal 30) defines a standard interface for dApp-wallet communication:

```javascript
// How it works:
const wallet = window.cardano.eternl;           // Get Eternl wallet object
const enabled = await wallet.enable();           // Request user approval
const addresses = await enabled.getAddresses();  // Retrieve addresses
```

### Data Retrieved

When you connect, Blue Dot retrieves:
- ✅ Your Cardano address(es)
- ✅ Wallet name
- ✅ Wallet icon
- ❌ Private keys (NOT accessed)
- ❌ Transaction history (NOT accessed)
- ❌ Balance (NOT accessed unless you explicitly request)

### Security Model

1. **Wallet Extension**: Manages private keys in browser sandbox
2. **User Approval**: Every connection request requires explicit user approval in wallet UI
3. **Read-only**: Blue Dot cannot sign transactions or move funds
4. **localStorage**: Wallet address is stored locally on your device only
5. **No Backend**: Wallet data never leaves your browser (backend only handles SMTP emails)

---

## Troubleshooting

### "Eternl wallet not installed"

**Solution**: 
- Install Eternl from https://eternl.io
- Ensure the browser extension is enabled
- Refresh the page after installation

### "No addresses found in wallet"

**Solution**:
- Open Eternl extension and verify you have a wallet created
- You should see at least one address in your wallet
- Try disconnecting and reconnecting

### Wallet not appearing when clicking "Connect"

**Solution**:
- Check that Eternl browser extension is installed and active
- Ensure you're using a compatible browser (Chrome, Firefox, Edge, Safari)
- Check browser console (F12 > Console) for error messages
- Try refreshing the page

### Address doesn't auto-fill

**Solution**:
- Manually paste your Cardano address from Eternl
- Ensure the address starts with `addr1` (mainnet) or `addr_test1` (testnet)
- Save settings after entering address

### Connection works but settings don't persist

**Solution**:
- Check if localStorage is enabled in your browser
- Try logging out and logging back in
- Clear browser cache and try again
- Check browser console for errors

---

## Advanced: Manual Address Entry

If you don't want to use Eternl, you can:

1. Copy your address from any Cardano wallet (Eternl, Daedalus, Yoroi, etc.)
2. Paste it in the **Manual Receiving Address** field in Profile settings
3. Click **Save Settings**

---

## Payment Flow with Eternl Address

### For Invoices:

1. **Connect Eternl Wallet** → Your address auto-fills
2. **Create Invoice** → Include items, client email, etc.
3. **Send Email** → Client receives invoice with payment link
4. **Client Pays** → They send ADA to your connected address
5. **You Receive** → ADA arrives in your Eternl wallet

### For Quotes:

1. **Connect Eternl Wallet** → Your address is saved
2. **Create Quote** → Client can approve/reject via email
3. **If Approved** → You can convert to Invoice and client pays to your address

---

## Multi-Wallet Support (Future)

Currently, Blue Dot supports:
- ✅ **Eternl** (primary)

Can be extended to support:
- 🔮 Yoroi
- 🔮 Lace (Cardano Foundation)
- 🔮 Nami
- 🔮 Flint

Would you like to add other wallet support? Let me know!

---

## Support & Resources

### Documentation

- **Eternl Official**: https://eternl.io
- **CIP-30 Spec**: https://github.com/cardano-foundation/CIPs/tree/master/CIP-0030
- **Cardano Docs**: https://docs.cardano.org

### Communities

- **Cardano Discord**: https://discord.gg/cardano
- **GitHub Issues**: Report bugs in the repository

### Testing on Testnet

To test with testnet ADA without real money:

1. In Eternl, switch to **Preprod** or **Preview** network
2. Get free testnet ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet/
3. Connect to Blue Dot (it will use your testnet address)

---

## FAQ

**Q: Is my private key shared with Blue Dot?**
A: No. CIP-30 is read-only for addresses only. Your private key never leaves Eternl.

**Q: Can Blue Dot send transactions?**
A: Not yet. Currently only read-only access. Future updates could enable transaction signing with user approval.

**Q: What if I disconnect the wallet?**
A: You can manually enter your address again, or reconnect your wallet.

**Q: Does this work on mobile?**
A: Eternl has mobile apps. You'll need to use the browser view or implement mobile wallet detection.

**Q: Can I use multiple addresses from one wallet?**
A: Currently, the first address is used. Future updates can support address selection.

---

## Changelog

### Version 1.0 (Current)

- ✅ Eternl wallet connection via CIP-30
- ✅ Auto-fill receiving address
- ✅ Wallet status display
- ✅ Disconnect wallet option
- ✅ LocalStorage persistence
- ✅ Error handling and user feedback

---

**Last Updated**: November 30, 2025
**Created for**: Blue Dot Assistant v1.0
