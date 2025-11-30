// src/CardanoInvoiceApp.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Wallet,
  History,
  Send,
  CheckCircle2,
  Loader2,
  CreditCard,
  FileText,
  Zap,
  Plus,
  Trash2,
  Calculator,
  Share2,
  Mail,
  User,
  LogOut,
  LogIn,
  Save,
  Key,
  CreditCard as CreditCardIcon, // Aliased to avoid conflict
  Link,
} from "lucide-react";

/**
 * MOCK DATA & UTILITIES
 */
const EXCHANGE_RATES = {
  ADA: 1,
  USD: 0.45, // 1 ADA = $0.45
  INR: 37.5, // 1 ADA = ₹37.50
  EUR: 0.41, // 1 ADA = €0.41
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "agent",
    text: "Hello! I'm your **Blue Dot Copilot**. I can help you instantly generate quotes, create invoices, and secure Cardano PayLinks.",
    type: "text",
  },
  {
    id: 2,
    role: "agent",
    text: "How can I help you generate a document today? (Try typing: 'I need an invoice for consulting')",
    type: "quick_actions", // Message type for buttons
  },
];

const MOCK_RECEIPTS = [
  {
    id: "inv_001",
    type: "INVOICE",
    service: "Logo Design",
    amount: 450,
    status: "PAID",
    hash: "tx_8d5f...b92a", // Mock Transaction Hash
    date: "2025-10-24",
  },
];

const generateHash = () => 'tx_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);

// --- UPDATED ID GENERATION FUNCTION (Sequential/Fiscal Year) ---
const generateDocId = (docType) => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec

  let startYear;
  let endYear;

  // Determine the Fiscal Year (e.g., runs from April 1st to March 31st)
  if (currentMonth >= 3) { // April (3) through December (11)
    startYear = currentYear;
    endYear = currentYear + 1;
  } else { // January (0) through March (2)
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  const fiscalYear = `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`; // e.g., '25-26'
  
  // Sequential part: Use a random number (01 to 99) for this demo.
  // This simulates fetching the next sequential document number from a database.
  const sequential = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0'); 
  
  // New format: SEQUENCE/FISCAL_YEAR (e.g., '01/25-26')
  return `${sequential}/${fiscalYear}`; 
};

// --- Backend/API Integration ---

const BACKEND_URL = "http://localhost:4000";

/**
 * **REAL API CALL**
 * This function calls the Express backend to handle real SMTP email sending
 * using the provided user credentials and the document data.
 */
async function sendDocumentEmailViaBackend(doc, smtpConfig) {
  if (!smtpConfig.username || !smtpConfig.password) {
    throw new Error("SMTP credentials missing.");
  }
  
  const response = await fetch(`${BACKEND_URL}/api/send-document-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smtpUser: smtpConfig.username,
      smtpPass: smtpConfig.password,
      doc: doc,
    }),
  });
  
  if (!response.ok) {
    let errorDetail = "Failed to send email via backend API.";
    try {
        const errorBody = await response.json();
        errorDetail = errorBody.error || errorDetail;
    } catch (e) { /* ignore parse error */ }
    throw new Error(errorDetail);
  }
  
  return { success: true, message: "Email queued successfully by backend" };
}

/**
 * Checks the status of a document from the backend API.
 */
async function checkInvoiceStatus(docId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/invoices/${docId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error checking status for ${docId}:`, error);
    return null;
  }
}

/**
 * MASUMI MONETIZATION MOCK
 * This simulates a successful on-chain agent invocation payment.
 */
function mockMasumiMonetization(setMessages) {
    const message = "✅ Masumi Agent Invocation: 0.1 ADA paid to Copilot. Form activated.";
    setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "system_alert", text: message },
    ]);
    setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.text !== message)), 4000);
}


// --- MAIN COMPONENT (CardanoInvoiceApp) ---

export default function CardanoInvoiceApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [userProfile, setUserProfile] = useState({
    username: "K M Ramya", // Default from project brief
    smtpConfig: {
      host: "smtp.gmail.com", // Host/Port is for display, backend handles it
      port: "587",
      username: "",
      password: "",
    },
    receivingAddress: "addr1qx...3k9z", // Merchant's Cardano address
  });
  
  const [sendingDocId, setSendingDocId] = useState(null);
  const [polledDocs, setPolledDocs] = useState([]); // Array of doc IDs to poll

  // Chat State
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Receipt State
  const [receipts, setReceipts] = useState(MOCK_RECEIPTS);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // --- Status Polling Logic (NEW) ---
  useEffect(() => {
    if (polledDocs.length === 0) return;

    const intervalId = setInterval(() => {
      polledDocs.forEach(async (docId) => {
        const updatedDoc = await checkInvoiceStatus(docId);
        
        if (updatedDoc && updatedDoc.clientDecision) {
          // 1. Decision received! Stop polling for this ID.
          setPolledDocs(prev => prev.filter(id => id !== docId));
          
          const decision = updatedDoc.clientDecision;
          const statusMessage = `✅ Client Decision Received! ${docId} was **${decision}** by the client. The card has been updated.`;
          
          // 2. Update the chat messages/card
          setMessages(prev => {
            const updated = prev.map(msg => {
              if (msg.type === "invoice_card" && msg.data.id === docId) {
                return {
                  ...msg,
                  data: {
                    ...msg.data,
                    clientDecision: decision,
                    status: decision === "APPROVED" ? "ACCEPTED" : "REJECTED",
                  }
                };
              }
              return msg;
            });
            // 3. Add system alert
            return [...updated, { id: Date.now() + 10, role: "system_alert", text: statusMessage }];
          });

          // 4. Update receipts
          setReceipts(prev => prev.map(r => r.id === docId ? {...r, status: decision === "APPROVED" ? "ACCEPTED" : "REJECTED"} : r));

        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount or when dependencies change
  }, [polledDocs, setMessages, setReceipts]);


  // --- Persistence & Authentication Handlers ---

  const loadInitialState = useCallback(() => {
    const savedLogin = localStorage.getItem("isLoggedIn");
    const savedProfile = localStorage.getItem("userProfile");

    if (savedLogin === "true" && savedProfile) {
      setIsLoggedIn(true);
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  const handleLogin = (username, password) => {
    // Mock Login Logic
    if (username === "merchant" && password === "cardano123") {
      setIsLoggedIn(true);
      // Load or set default profile for mock user
      const defaultProfile = {
        username: "K M Ramya",
        smtpConfig: {
          host: "smtp.gmail.com",
          port: "587",
          username: "merchant@example.com",
          password: "mock-app-password",
        },
        receivingAddress: "addr1qx...3k9z",
      };
      const profileToUse = JSON.parse(localStorage.getItem("userProfile")) || defaultProfile;
      setUserProfile(profileToUse);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userProfile", JSON.stringify(profileToUse));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab("chat");
    localStorage.removeItem("isLoggedIn");
  };

  const handleUpdateProfile = (newProfileData) => {
    setUserProfile(newProfileData);
    localStorage.setItem("userProfile", JSON.stringify(newProfileData));
    const message = "Profile and SMTP settings saved successfully!";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "system_alert", text: message },
    ]);
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.filter((msg) => msg.role !== "system_alert")
        ),
      3000
    );
  };


  // --- Chat & Document Handlers ---

  const handleQuickAction = (actionType) => {
    const isQuote = actionType === "QUOTE";
    const actionText = isQuote ? "Create Quote" : "Create Invoice";
    // 1. Add user message (simulated click)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: actionText, type: "text" },
    ]);
    
    // 2. Mock Masumi Monetization
    mockMasumiMonetization(setMessages);

    // 3. Trigger form request
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "agent",
          text: `Sure! Let's create a new ${
            isQuote ? "Quote" : "Invoice"
          }. Please fill in the details below.`,
          type: "form_request",
          defaultType: actionType,
        },
      ]);
      scrollToBottom();
    }, 1000); // 1s delay for Masumi alert to show first
  };

  // Global handler for the top-right button
  const handleSendLatestToClient = () => {
    const latestDoc = messages
      .slice()
      .reverse()
      .find((msg) => msg.type === "invoice_card")?.data;
    if (latestDoc) {
      handleDocumentAction(latestDoc, "send");
    } else {
      const message =
        "No document generated yet. Please create a Quote or Invoice first.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "system_alert", text: message },
      ]);
    }
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.filter((msg) => msg.role !== "system_alert")
        ),
      3000
    );
  };

  /**
   * CHAT-TO-PAY FLOW
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMsg = {
      id: Date.now(),
      role: "user",
      text: inputText,
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);
    const lowerCaseText = inputText.toLowerCase();
    setInputText("");
    setIsTyping(true);

    // Mock AI Intent Recognition
    let docType = null;
    if (lowerCaseText.includes("invoice") || lowerCaseText.includes("bill")) {
      docType = "INVOICE";
    } else if (lowerCaseText.includes("quote") || lowerCaseText.includes("estimate")) {
      docType = "QUOTE";
    }

    setTimeout(() => {
      setIsTyping(false);
      if (docType) {
        // 1. Mock Masumi Monetization (Agent Invocation)
        mockMasumiMonetization(setMessages);

        // 2. Agent responds with form
        const agentResponse = {
            id: Date.now() + 2,
            role: "agent",
            text: `Analyzing request... Found intent for a new ${docType}. Please confirm the details below.`,
            type: "form_request",
            defaultType: docType,
        };
        setMessages((prev) => [...prev, agentResponse]);
      } else {
        // Generic response
        const agentResponse = {
          id: Date.now() + 1,
          role: "agent",
          text: "I didn't recognize a document request. Please use keywords like 'create invoice' or 'send quote' or use the quick action buttons.",
          type: "text",
        };
        setMessages((prev) => [...prev, agentResponse]);
      }
      scrollToBottom();
    }, 1500);
  };

  // Called when the user submits the form bubble
  const handleFormSubmit = (formData) => {
    // 1. Calculate Conversions
    const rate = EXCHANGE_RATES[formData.currency] || 1;
    const totalInADA = Math.ceil(
      formData.total / (EXCHANGE_RATES[formData.currency] / EXCHANGE_RATES["ADA"])
    );
    // 2. Create the Invoice Object
    const newDoc = {
      id: generateDocId(formData.docType),
      ...formData,
      customerEmail: formData.customerEmail, 
      amountADA: totalInADA,
      status: formData.docType === "QUOTE" ?
        "DRAFT" : "PENDING",
      clientDecision: null,
      hash: "TX_AWAITING", // Placeholder for transaction hash
      merchantAddress: userProfile.receivingAddress, // Attach merchant address
    };

    // 3. Add the "Invoice Card" to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "agent",
        type: "invoice_card",
        data: newDoc,
      },
      {
        id: Date.now() + 1,
        role: "system_alert",
        text: `${newDoc.docType} ${newDoc.id} generated. Metadata (ID, total) is ready for **on-chain logging** after payment is confirmed.`,
      }
    ]);

    // 4. Update Receipts for tracking
    const newReceipt = {
      id: newDoc.id,
      type: newDoc.docType,
      service: newDoc.items[0]?.desc || "Service",
      amount: newDoc.amountADA,
      status: newDoc.status,
      hash: "TX_AWAITING",
      date: new Date().toISOString().split("T")[0],
    };
    setReceipts((prev) => [newReceipt, ...prev.filter(r => r.id !== newDoc.id)]);
  };

  // Custom Alert Handler with backend SMTP sending
  const handleDocumentAction = async (doc, action) => {
    const smtpConfig = userProfile.smtpConfig;

    if (action === "paylink") {
      const message = "Cardano PayLink functionality is disabled as per user request.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "system_alert", text: message },
      ]);
      setTimeout(
        () =>
          setMessages((prev) =>
            prev.filter((msg) => msg.role !== "system_alert")
          ),
        4000
      );
      return;
    }


    if (action === "send") {
      // Email sending logic
      if (
        !smtpConfig.username.trim() ||
        !smtpConfig.password.trim()
      ) {
        const message =
          "Email setup required! Please set your sender email & app password in the **Profile** tab before sending.";
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "system_alert", text: message },
        ]);
        setTimeout(
          () =>
            setMessages((prev) =>
              prev.filter((msg) => msg.role !== "system_alert")
            ),
          5000
        );
        return;
      }
      
      if (!doc.customerEmail || !doc.customerEmail.includes('@')) {
         const message =
          "Email sending failed: Please ensure a valid client email is entered in the form before generating the document.";
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "system_alert", text: message },
        ]);
        setTimeout(
          () =>
            setMessages((prev) =>
              prev.filter((msg) => msg.role !== "system_alert")
            ),
          5000
        );
        return;
      }


      try {
        setSendingDocId(doc.id);
        // --- REAL API CALL TO BACKEND ---
        await sendDocumentEmailViaBackend(doc, smtpConfig);
        // --------------------------------

        const sentAt = new Date().toISOString();
        const message = `Email Sent! ${doc.docType} ${doc.id} delivered to ${doc.customerEmail}. Client can now Approve/Reject via email.`;
        
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) => {
            if (msg.type === "invoice_card" && msg.data.id === doc.id) {
              return {
                ...msg,
                data: {
                  ...msg.data,
                  lastSentTo: doc.customerEmail,
                  lastSentAt: sentAt,
                  status: doc.docType === "QUOTE" ? "SENT" : "PENDING_SENT",
                },
              };
            }
            return msg;
          });

          return [
            ...updatedMessages,
            { id: Date.now(), role: "system_alert", text: message },
          ];
        });
        
        setReceipts(prev => prev.map(r => r.id === doc.id ? {...r, status: doc.docType === "QUOTE" ? "SENT" : "PENDING_SENT"} : r));

        // Start polling for Quotes to get the client's decision
        if (doc.docType === "QUOTE") {
          setPolledDocs(prev => [...new Set([...prev, doc.id])]);
        }

      } catch (error) {
        console.error(error);
        const message = `Failed to send email for ${doc.id}: ${error.message}`;
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "system_alert", text: message },
        ]);
      } finally {
        setSendingDocId(null);
        setTimeout(
          () =>
            setMessages((prev) =>
              prev.filter((msg) => msg.role !== "system_alert")
            ),
          5000
        );
      }
      return;
    }

    // Removed action === "share" logic
  };

  // --- RENDER LOGIC ---

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>

      {/* MAIN APPLICATION CONTAINER */}
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-20 md:w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
          <div className="p-6 flex items-center justify-center md:justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="hidden md:block font-bold text-xl tracking-tight text-white">
              Blue Dot
            </span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarItem
              icon={<MessageSquare size={20} />}
              label="Copilot Chat"
              active={activeTab === "chat"}
              onClick={() => setActiveTab("chat")}
            />
            <SidebarItem
              icon={<History size={20} />}
              label="Receipts"
              active={activeTab === "receipts"}
              onClick={() => setActiveTab("receipts")}
            />
            <SidebarItem
              icon={<User size={20} />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>

          <div className="p-4 border-t border-gray-800">
             <div className="hidden md:block text-xs text-gray-500 mb-2 truncate">
                User: {userProfile.username}
            </div>
            <SidebarItem
              icon={<LogOut size={20} />}
              label="Log Out"
              active={false}
              onClick={handleLogout}
            />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* HEADER */}
          <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shadow-sm z-10">
            <h2 className="text-lg font-medium text-white">
              {activeTab === "chat"
                ? "Blue Dot Copilot"
                : activeTab === "receipts"
                ? "Transaction History"
                : "Profile & Settings"}
            </h2>

            {/* Global Send to Client Button */}
            {activeTab === "chat" && (
              <button
                onClick={handleSendLatestToClient}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                    bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
              >
                <Send size={16} />
                Send Last Document
              </button>
            )}
          </header>

          {/* BODY */}
          <main className="flex-1 overflow-hidden relative bg-gray-900">
            {activeTab === "chat" && (
              <ChatView
                messages={messages}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
                inputText={inputText}
                setInputText={setInputText}
                handleSendMessage={handleSendMessage}
                handleQuickAction={handleQuickAction}
                handleFormSubmit={handleFormSubmit}
                handleDocumentAction={handleDocumentAction}
                sendingDocId={sendingDocId}
              />
            )}
            {activeTab === "receipts" && <ReceiptsView receipts={receipts} />}
            {activeTab === "profile" && (
              <ProfileSettings
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// --- NEW/UPDATED SCREENS AND COMPONENTS ---

/**
 * LOGIN SCREEN
 */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("merchant");
  const [password, setPassword] = useState("cardano123");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const success = onLogin(username, password);
    if (!success) {
      setError("Invalid username or password. Use 'merchant'/'cardano123'");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700 space-y-6"
      >
        <div className="text-center">
          <Zap className="w-10 h-10 text-blue-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">Blue Dot Login</h2>
          <p className="text-sm text-gray-400">Merchant Access (Demo Credentials)</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Username (Demo)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="merchant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Password (Demo)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors shadow-lg"
        >
          <LogIn size={20} /> Sign In
        </button>
      </form>
    </div>
  );
}

/**
 * PROFILE SETTINGS SCREEN (New Tab)
 */
function ProfileSettings({ userProfile, onUpdateProfile }) {
  const [smtpUsername, setSmtpUsername] = useState(userProfile.smtpConfig.username);
  const [smtpPassword, setSmtpPassword] = useState(userProfile.smtpConfig.password);
  const [cardanoAddress, setCardanoAddress] = useState(userProfile.receivingAddress);

  const handleSave = (e) => {
    e.preventDefault();
    const newProfile = {
      ...userProfile,
      smtpConfig: {
        ...userProfile.smtpConfig,
        username: smtpUsername,
        password: smtpPassword,
      },
      receivingAddress: cardanoAddress,
    };
    onUpdateProfile(newProfile);
  };

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <User size={24} className="text-blue-400" /> Merchant Profile & Settings
      </h3>

      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg space-y-6 max-w-3xl">
        {/* Cardano Receiving Address */}
        <div className="space-y-3 border-b border-gray-700 pb-6">
          <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <Wallet size={20} className="text-teal-400" /> Cardano Wallet (CIP-30)
          </h4>
          <p className="text-sm text-gray-400">
            This address is used to receive **ADA** payments via the **CIP-30 PayLink** protocol.
          </p>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Receiving Cardano Address
            </label>
            <input
              value={cardanoAddress}
              onChange={(e) => setCardanoAddress(e.target.value)}
              placeholder="addr1qx..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono break-all focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <Mail size={20} className="text-yellow-400" /> Email Setup (SMTP)
          </h4>
          <p className="text-sm text-gray-400">
            Use your email credentials to deliver quotes and invoices directly to clients.
          </p>
          
          <div className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 flex items-center gap-2 text-xs text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>Server settings are preconfigured for Gmail (smtp.gmail.com:587).</span>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Sender Email</label>
              <input
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="your_email@gmail.com"
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">
                App Password
              </label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="16-char app password"
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            Tip: For Gmail, you must generate a 16-character **App Password** for "Mail" in your Google Security settings. Never use your normal login password.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500"
        >
          <Save size={20} /> Save Settings
        </button>
      </div>
    </div>
  );
}

/**
 * CHAT VIEW (Extracted from CardanoInvoiceApp for cleanliness)
 */
function ChatView({
  messages,
  isTyping,
  messagesEndRef,
  inputText,
  setInputText,
  handleSendMessage,
  handleQuickAction,
  handleFormSubmit,
  handleDocumentAction,
  sendingDocId,
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } ${msg.role === "system_alert" ? "w-full" : ""}`}
          >
            {/* System Alert Bubble (Masumi/System Feedback) */}
            {msg.role === "system_alert" && (
              <div className="w-full text-center">
                <div className={`inline-flex items-center px-4 py-2 text-sm rounded-full shadow-lg 
                    ${msg.text.includes("Masumi") ? "bg-green-600/20 text-green-300 border border-green-600" : "bg-yellow-600/20 text-yellow-300 border border-yellow-600"}`}>
                  {msg.text}
                </div>
              </div>
            )}

            {/* Chat Bubbles */}
            {(msg.role === "user" || msg.role === "agent") && (
              <div
                className={`max-w-[95%] md:max-w-[85%] lg:max-w-[70%] ${
                  msg.role === "user" ? "items-end" : "items-start"
                } flex flex-col gap-1`}
              >
                <span className="text-xs text-gray-500 ml-1">
                  {msg.role === "user" ? "You" : "Blue Dot Copilot"}
                </span>

                {msg.type === "text" && (
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {msg.type === "quick_actions" && (
                  <QuickActionsBubble onAction={handleQuickAction} />
                )}

                {msg.type === "form_request" && (
                  <div className="w-full max-w-lg">
                    <InvoiceFormBubble
                      defaultType={msg.defaultType}
                      onSubmit={handleFormSubmit}
                    />
                  </div>
                )}

                {msg.type === "invoice_card" && (
                  <InvoicePreviewCard
                    data={msg.data}
                    onDocumentAction={handleDocumentAction}
                    isSendingEmail={sendingDocId === msg.data.id}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form
          onSubmit={handleSendMessage}
          className="relative max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Copilot: 'Create an invoice for web development'..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-5 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}


// --- OTHER COMPONENTS (Re-used/Modified) ---

/**
 * QUICK ACTIONS BUBBLE
 */
function QuickActionsBubble({ onAction }) {
  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm flex flex-col gap-3">
      <p className="text-gray-200 text-sm">Select an action (Masumi invocation required):</p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onAction("QUOTE")}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
        >
          <FileText size={16} /> Create Quote
        </button>
        <button
          onClick={() => onAction("INVOICE")}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
        >
          <CreditCardIcon size={16} /> Create Invoice
        </button>
      </div>
    </div>
  );
}

/**
 * INVOICE FORM BUBBLE
 */
function InvoiceFormBubble({ onSubmit, defaultType = "INVOICE" }) {
  const [submitted, setSubmitted] = useState(false);
  const [docType, setDocType] = useState(defaultType); // INVOICE | QUOTE
  const [currency, setCurrency] = useState("USD");
  const [customerName, setCustomerName] = useState("Acme Corp");
  const [customerEmail, setCustomerEmail] = useState("client@example.com"); 
  const [gstNumber, setGstNumber] = useState("");
  const [billingAddr, setBillingAddr] = useState("123 Main St, New York, NY 10001");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Payment due within 30 days. Late payments incur a 5% penalty. **CIP-30 payment required in ADA.**"
  );
  const [items, setItems] = useState([
    { id: 1, desc: "Cardano DApp Development", qty: 1, price: 500, taxRate: 0 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), desc: "", qty: 1, price: 0, taxRate: 0 },
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    items.forEach((item) => {
      const lineTotal = item.qty * item.price;
      subtotal += lineTotal;
      taxAmount += lineTotal * (item.taxRate / 100);
    });
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleSubmit = () => {
    
    if (
      !customerName.trim() ||
      !billingAddr.trim() ||
      !termsAndConditions.trim() ||
      !customerEmail.trim() ||
      !customerEmail.includes('@')
    ) {
      console.error(
        "Client Name, Email, Billing Address, and Terms & Conditions are mandatory."
      );
      return;
    }

    if (items.some((i) => !i.desc.trim() || i.price <= 0)) {
      console.error(
        "All line items must have a description and a positive price."
      );
      return;
    }

    setSubmitted(true);
    const totals = calculateTotals();
    onSubmit({
      docType,
      customerName,
      customerEmail,
      gstNumber,
      billingAddr,
      termsAndConditions,
      items,
      currency,
      ...totals,
    });
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-bl-none text-gray-400 text-sm italic">
        ✓ {docType === "QUOTE" ? "Quote" : "Invoice"} details submitted. Check
        the generated card above!
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg rounded-bl-none text-sm animate-in zoom-in-95 duration-300 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <span className="font-semibold text-white flex items-center gap-2">
          <Calculator size={16} className="text-blue-400" /> New Document
          Details
        </span>
        <div className="flex bg-gray-900 rounded-lg
          p-0.5">
          <button
            onClick={() => setDocType("QUOTE")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              docType === "QUOTE"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Quote
          </button>
          <button
            onClick={() => setDocType("INVOICE")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              docType === "INVOICE"
                ? "bg-teal-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Invoice
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* Customer Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Client Details (Mandatory fields *)
          </label>
          <input
            type="text"
            placeholder="* Client / Company Name"
            className="w-full bg-gray-900
            border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <input
            type="email"
            placeholder="* Client Email Address (for sending)"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="GST / Tax ID (Optional)"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
          />
          <textarea
            placeholder="* Billing Address"
            rows="2"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={billingAddr}
            onChange={(e) => setBillingAddr(e.target.value)}
          />
        </div>

        {/* Line Items Section */}
        <div className="space-y-3 pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Line Items
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-gray-900 text-white text-xs border border-gray-700 rounded px-2 py-1"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="ADA">ADA (₳)</option>
            </select>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900/50 p-2 rounded border border-gray-700 relative group"
            >
              <div className="flex justify-between mb-2">
                <input
                  type="text"
                  placeholder="* Item Description"
                  className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm focus:border-blue-500 outline-none mr-2"
                  value={item.desc}
                  onChange={(e) => updateItem(item.id, "desc", e.target.value)}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500
                    hover:text-red-400 opacity-100 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(item.id, "qty", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">* Price</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.id, "price", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.taxRate}
                    onChange={(e) =>
                      updateItem(item.id, "taxRate", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addItem}
            className="text-xs text-blue-400 hover:text-blue-300 flex
            items-center gap-1"
          >
            <Plus size={12} /> Add Item
          </button>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            * Terms & Conditions
          </label>
          <textarea
            placeholder="Payment and service terms..."
            rows="2"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none text-xs"
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
          />
        </div>

        {/* Total Preview */}
        <div className="bg-gray-900 rounded p-3 flex justify-between items-center border border-gray-700">
          <span className="text-gray-400 text-xs">Total:</span>
          <span className="text-white font-bold text-lg">
            {currency === "USD" ?
              "$" : currency === "INR" ? "₹" : currency === "EUR" ?
                "€" : "₳"} {calculateTotals().total.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-colors text-white ${
            docType === "QUOTE"
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-teal-600 hover:bg-teal-500"
          }`}
        >
          Generate {docType === "QUOTE" ? "Quote" : "Invoice"}
        </button>
      </div>
    </div>
  );
}

/**
 * INVOICE PREVIEW CARD
 */
function InvoicePreviewCard({ data, onDocumentAction, isSendingEmail }) {
  const { id, docType, customerName, total, amountADA, status, lastSentTo, lastSentAt, clientDecision, merchantAddress } = data;
  const isQuote = docType === "QUOTE";

  let statusBadge;
  if (clientDecision === "APPROVED") {
    statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-green-600 border-green-200 bg-green-50">
        CLIENT APPROVED
      </span>
    );
  } else if (clientDecision === "REJECTED") {
    statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-red-600 border-red-200 bg-red-50">
        CLIENT REJECTED
      </span>
    );
  } else if (status === "PENDING_SENT" || status === "PENDING" || status === "SENT") {
    // If quote is SENT, show PENDING CLIENT to indicate we're waiting for decision/payment
    let displayStatus = status;
    if (status === "SENT" && isQuote) displayStatus = "PENDING CLIENT DECISION";
    else if (status === "PENDING_SENT") displayStatus = "PENDING CLIENT PAYMENT";

    statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-yellow-600 border-yellow-200 bg-yellow-50">
        {displayStatus}
      </span>
    );
  } else if (status === "ACCEPTED") {
    statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-blue-600 border-blue-200 bg-blue-50">
        QUOTE ACCEPTED
      </span>
    );
  } else if (status === "PAID") {
    statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-teal-600 border-teal-200 bg-teal-50">
        PAID
      </span>
    );
  } else {
     statusBadge = (
      <span className="px-3 py-1 rounded text-xs font-bold uppercase text-gray-600 border-gray-200 bg-gray-50">
        {status || "DRAFT"}
      </span>
    );
  }

  // Logic to determine currency symbol based on the total's original currency
  const currencySymbol = data.currency === "USD" ? "$" : data.currency === "INR" ?
    "₹" : data.currency === "EUR" ? "€" : "₳";


  return (
    <div className="w-full max-w-md bg-white text-gray-900 rounded-sm overflow-hidden shadow-2xl transform transition-all relative">
      <style>{`
        .invoice-card-container {
          max-width: 100vw;
        }
        .text-wrap-break {
          word-break: break-word;
        }
      `}</style>
      {/* Decorative Top Border */}
      <div
        className={`h-2 w-full ${isQuote ? "bg-blue-600" : "bg-teal-600"}`}
      ></div>

      <div className="p-6 md:p-8 invoice-card-container">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                  isQuote ? "bg-blue-600" : "bg-teal-600"
                }`}
              >
                BD
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-800">
                Blue Dot
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Service: {data.items[0]?.desc || 'General Service'}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-light text-gray-300 tracking-widest uppercase">
              {isQuote ? "QUOTE" : "INVOICE"}
            </h1>
            <p className="font-medium text-gray-700 mt-1">#{id}</p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Client Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-gray-100 py-6">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
              Bill To
            </span>
            <h3 className="font-bold text-gray-800 text-sm text-wrap-break">
              {customerName}
            </h3>
          </div>
          <div className="text-right flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                Total Due ({data.currency})
              </span>
              <span
                className={`text-2xl font-bold ${
                  isQuote ? "text-blue-600" : "text-teal-600"
                }`}
              >
                {currencySymbol} {total.toFixed(2)}
              </span>
            </div>

            <div className="inline-block self-end mt-2">
                {statusBadge}
            </div>
          </div>
        </div>

        {/* Line Items Table (Showing all products) */}
        <h3 className="font-bold text-sm text-gray-700 mb-2">Line Items</h3>
        <div className="mb-6 overflow-x-auto border border-gray-100 rounded-lg">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                            Description
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {data.items.map((item, index) => (
                        <tr key={index}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-800">
                                {item.desc}
                                {item.taxRate > 0 && (
                                    <span className="text-xs text-gray-400 ml-2">({item.taxRate}% Tax)</span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700">
                                {item.qty}
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700 whitespace-nowrap">
                                {currencySymbol} {item.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-sm font-semibold text-right text-gray-800 whitespace-nowrap">
                                {currencySymbol} {(item.qty * item.price * (1 + item.taxRate / 100)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>


        {/* Merchant Cardano Address Detail */}
        <div className="pt-4 mb-4 border-t border-gray-100">
          <h4 className="font-bold text-xs text-gray-700 mb-1 flex items-center gap-1">
            <Key size={12} /> Payment Address
          </h4>
          <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded font-mono break-all">
            {merchantAddress}
          </p>
        </div>


        {/* Terms and Conditions */}
        <div className="pt-2 mb-8">
          <h4 className="font-bold text-sm text-gray-700 mb-1">
            Terms & Conditions
          </h4>
          <div className="text-xs text-gray-500 border-l-4 border-gray-200 pl-3 italic whitespace-pre-wrap rounded-r-lg bg-gray-50 p-2">
            {data.termsAndConditions}
          </div>
        </div>

        {/* Footer / Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Grand Total ({data.currency})</span>
              <span className="whitespace-nowrap">
                {currencySymbol} {total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium text-teal-600 mt-1">
              <span>Client Must Pay (ADA)</span>
              <span className="whitespace-nowrap font-bold text-lg">{amountADA} ₳</span>
            </div>
          </div>
        </div>

        {/* Call to Action and Metadata */}
        <div className="space-y-3">
          {/* Action Buttons: Send Email (now full width) */}
          <button
            onClick={() => onDocumentAction(data, "send")}
            disabled={isSendingEmail}
            className={`w-full py-3 rounded-lg text-lg font-bold transition-colors flex items-center justify-center gap-2 ${
              isSendingEmail
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white" 
            }`}
          >
            {isSendingEmail ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={20} /> Send Email
              </>
            )}
          </button>

          {lastSentAt && (
            <p className="text-[10px] text-gray-400 text-center pt-2">
              Last sent to <span>{lastSentTo}</span> on{" "}
              {new Date(lastSentAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * RECEIPTS / HISTORY VIEW
 */
function ReceiptsView({ receipts }) {
  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xl font-semibold text-white mb-6">
        Transaction History & Receipts
      </h3>
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Service
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Amount (₳)
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tx Hash / Decision
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {receipts.map((receipt) => (
              <tr
                key={receipt.id}
                className="hover:bg-gray-700 transition-colors"
              >
                <td className="p-4 text-sm font-mono text-blue-400">
                  {receipt.id}
                </td>
                <td className="p-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      receipt.type === "INVOICE"
                        ? "bg-teal-900 text-teal-300"
                        : "bg-blue-900 text-blue-300"
                    }`}
                  >
                    {receipt.type || "INVOICE"}
                  </span>
                </td>
                <td className="p-4">
                  <StatusBadge status={receipt.status} />
                </td>
                <td className="p-4 text-gray-200 font-medium">
                  {receipt.service}
                </td>
                <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                  {receipt.date}
                </td>
                <td className="p-4 text-gray-200 font-bold font-mono whitespace-nowrap">
                  {receipt.amount} ₳
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <span className={`text-xs font-mono transition-colors truncate max-w-[120px] 
                       ${receipt.hash === "TX_AWAITING" ? "text-yellow-500" : "text-gray-500 group-hover:text-blue-400"}`}>
                      {receipt.hash}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let colorClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  let icon = <Loader2 size={12} className="animate-spin" />;

  switch (status) {
    case "PAID":
      colorClass = "bg-teal-500/10 text-teal-400 border-teal-500/20";
      icon = <CheckCircle2 size={12} />;
      break;
    case "ACCEPTED":
      colorClass = "bg-green-500/10 text-green-400 border-green-500/20";
      icon = <CheckCircle2 size={12} />;
      break;
    case "REJECTED":
      colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
      icon = <Trash2 size={12} />;
      break;
    case "PENDING":
    case "SENT":
    case "PENDING_SENT":
    case "PENDING_PAY":
      colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      icon = <Send size={12} />;
      break;
    default:
      // DRAFT or others
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {icon}
      {status}
    </span>
  );
}

/**
 * HELPER COMPONENTS
 */
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${
        active
          ? "bg-gray-800 text-white shadow-md border-r-4 border-blue-500"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      } py-3 px-3 md:px-5 rounded-lg transition-all duration-200 group`}
    >
      {icon}
      <span className="hidden md:block ml-4 text-sm font-medium">
        {label}
      </span>
    </button>
  );
}