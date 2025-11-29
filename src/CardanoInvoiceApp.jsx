import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

/**
 * MOCK DATA & UTILITIES
 */
const EXCHANGE_RATES = {
  ADA: 1,
  USD: 0.45,   // 1 ADA = $0.45
  INR: 37.50,  // 1 ADA = ₹37.50
  EUR: 0.41    // 1 ADA = €0.41
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'agent',
    text: "Hello! I'm your Cardano Invoice Copilot. I can help you create professional Quotes and Tax Invoices.",
    type: 'text'
  },
  {
    id: 2,
    role: 'agent',
    text: "What would you like to generate today?",
    type: 'quick_actions' // Message type for buttons
  }
];

const MOCK_RECEIPTS = [
  { id: 'inv_001', type: 'INVOICE', service: 'Logo Design', amount: 450, status: 'PAID', hash: 'addr1...8f92', date: '2025-10-24' },
];

const generateHash = () => 'tx_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
const generateDocId = (docType) => `${docType === 'QUOTE' ? 'QT' : 'INV'}_${Date.now().toString().slice(-6)}`;

/**
 * MAIN COMPONENT (Chatbot Interface)
 */
export default function CardanoInvoiceApp() {
  const [activeTab, setActiveTab] = useState('chat'); 
  const [walletConnected, setWalletConnected] = useState(false); 
  const [walletAddress, setWalletAddress] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
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

  // --- Handlers ---

  const handleQuickAction = (actionType) => {
    const isQuote = actionType === 'QUOTE';
    const actionText = isQuote ? 'Create Quote' : 'Create Invoice';
    
    // 1. Add user message (simulated click)
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: actionText, type: 'text' }]);

    // 2. Trigger form request
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        text: `Sure! Let's create a new ${isQuote ? 'Quote' : 'Invoice'}. Please fill in the details below.`,
        type: 'form_request',
        defaultType: actionType
      }]);
      scrollToBottom();
    }, 500);
  };
  
  const handleConnectWallet = () => {
    setTimeout(() => {
      setWalletConnected(true);
      setWalletAddress('addr1qx...3k9z');
      // Using a custom modal/message box instead of alert()
      const message = "Wallet Connected. You can now use the 'Pay Now' button on invoices.";
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'system_alert', text: message }]);
    }, 800);
  };

  // Global handler for the top-right button
  const handleSendLatestToClient = () => {
    // Find the latest generated document (Invoice or Quote card)
    const latestDoc = messages.slice().reverse().find(msg => msg.type === 'invoice_card')?.data;

    if (latestDoc) {
      const message = `Simulating 'Send to Client' functionality for ${latestDoc.docType} #${latestDoc.id}: Automated email with PayLink generated for ${latestDoc.customerName}.`;
      setMessages(prev => [...prev, { id: Date.now(), role: 'system_alert', text: message }]);
    } else {
      const message = "No document generated yet. Please create a Quote or Invoice first.";
      setMessages(prev => [...prev, { id: Date.now(), role: 'system_alert', text: message }]);
    }
    setTimeout(() => setMessages(prev => prev.filter(msg => msg.role !== 'system_alert')), 3000);
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', text: inputText, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Minimal AI response for text input, encouraging use of buttons
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        text: "I see you typed a message! For generating documents, it's quickest to use the 'Create Quote' or 'Create Invoice' buttons above.",
        type: 'text'
      }]);
    }, 1000);
  };

  // Called when the user submits the form bubble
  const handleFormSubmit = (formData) => {
    // 1. Calculate Conversions
    const rate = EXCHANGE_RATES[formData.currency] || 1;
    // Simple conversion logic for display: Convert Fiat total to ADA
    const totalInADA = Math.ceil(formData.total / (EXCHANGE_RATES[formData.currency] / EXCHANGE_RATES['ADA']));

    // 2. Create the Invoice Object
    const newDoc = {
      id: generateDocId(formData.docType),
      ...formData,
      amountADA: totalInADA,
      status: formData.docType === 'QUOTE' ? 'DRAFT' : 'PENDING'
    };

    // 3. Add the "Invoice Card" to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'agent',
      type: 'invoice_card',
      data: newDoc
    }]);
  };

  const handlePayInvoice = (docId, amountADA, service, docType) => {
    if (!walletConnected) {
      handleConnectWallet(); // Prompt connection if not connected
      return;
    }

    setMessages(prev => prev.map(msg => {
      if (msg.type === 'invoice_card' && msg.data.id === docId) {
        return { ...msg, data: { ...msg.data, status: 'PROCESSING' } };
      }
      return msg;
    }));

    setTimeout(() => {
      const txHash = generateHash();
      const finalStatus = docType === 'QUOTE' ? 'ACCEPTED' : 'PAID';
      
      setMessages(prev => prev.map(msg => {
        if (msg.type === 'invoice_card' && msg.data.id === docId) {
          return { ...msg, data: { ...msg.data, status: finalStatus, hash: txHash } };
        }
        return msg;
      }));

      // Only add to receipts if it's an Invoice Payment
      if (docType === 'INVOICE') {
        const newReceipt = {
          id: docId,
          type: 'INVOICE',
          service,
          amount: amountADA,
          status: 'PAID',
          hash: txHash,
          date: new Date().toISOString().split('T')[0]
        };
        setReceipts(prev => [newReceipt, ...prev]);
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'agent',
        text: docType === 'QUOTE' 
          ? `Quote accepted! Transaction recorded for verification on Cardano. Hash: ${txHash}`
          : `Payment successful! Transaction Hash: ${txHash}`,
        type: 'text'
      }]);

    }, 2000);
  };
  
  // Custom Alert Handler
  const handleDocumentAction = (docId, action) => {
    let message = '';
    if (action === 'send') {
        message = `Email sent! Document ${docId} securely delivered with a PayLink.`;
    } else if (action === 'share') {
        message = `Share link copied! Secure link for ${docId} is ready to share.`;
    }
    setMessages(prev => [...prev, { id: Date.now(), role: 'system_alert', text: message }]);
    setTimeout(() => setMessages(prev => prev.filter(msg => msg.role !== 'system_alert')), 3000);
  };


  return (
    // FIX: Using a Fragment to contain the style and the main div
    <>
      {/* Load Tailwind CSS */}
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* Custom CSS (Fixed to prevent boolean attribute warning) */}
      <style>{`
        /* Custom scrollbar for better look in dark mode */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* gray-800 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; /* gray-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
      `}</style>
      
      {/* MAIN APPLICATION CONTAINER */}
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-20 md:w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
          <div className="p-6 flex items-center justify-center md:justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="hidden md:block font-bold text-xl tracking-tight text-white">Blue Dot</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarItem 
              icon={<MessageSquare size={20} />} 
              label="Copilot Chat" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
            />
            <SidebarItem 
              icon={<History size={20} />} 
              label="Receipts" 
              active={activeTab === 'receipts'} 
              onClick={() => setActiveTab('receipts')} 
            />
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER */}
          <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shadow-sm z-10">
            <h2 className="text-lg font-medium text-white">
              {activeTab === 'chat' ? 'Document Generator' : 'Transaction History'}
            </h2>
            
            {/* Global Send to Client Button */}
            <button 
              onClick={handleSendLatestToClient}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
            >
              <Send size={16} />
              Send Last Document
            </button>
          </header>

          {/* BODY */}
          <main className="flex-1 overflow-hidden relative bg-gray-900">
            
            {activeTab === 'chat' ? (
              <div className="h-full flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.role === 'system_alert' ? 'w-full' : ''}`}
                    >
                      
                      {/* System Alert Bubble (replaces alert()) */}
                      {msg.role === 'system_alert' && (
                          <div className="w-full text-center">
                              <div className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm rounded-full shadow-lg">
                                  {msg.text}
                              </div>
                          </div>
                      )}

                      {/* Chat Bubbles */}
                      {(msg.role === 'user' || msg.role === 'agent') && (
                        <div className={`max-w-[95%] md:max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            
                            {/* Name Label */}
                            <span className="text-xs text-gray-500 ml-1">
                              {msg.role === 'user' ? 'You' : 'Blue Dot Agent'}
                            </span>

                            {/* Content Bubble Types */}
                            {msg.type === 'text' && (
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none shadow-sm'
                              }`}>
                                {msg.text}
                              </div>
                            )}
                            
                            {msg.type === 'quick_actions' && (
                              <QuickActionsBubble onAction={handleQuickAction} />
                            )}

                            {msg.type === 'form_request' && (
                              <div className="w-full max-w-lg">
                                <InvoiceFormBubble 
                                  defaultType={msg.defaultType} 
                                  onSubmit={handleFormSubmit} 
                                />
                              </div>
                            )}

                            {msg.type === 'invoice_card' && (
                              <InvoicePreviewCard 
                                data={msg.data} 
                                onPay={() => handlePayInvoice(msg.data.id, msg.data.amountADA, msg.data.items[0]?.desc || 'Service', msg.data.docType)} 
                                onDocumentAction={handleDocumentAction}
                                walletConnected={walletConnected}
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
                  <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message or use the buttons above..."
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
            ) : (
              <ReceiptsView receipts={receipts} />
            )}

          </main>
        </div>
      </div>
    </>
  );
}

/**
 * QUICK ACTIONS BUBBLE
 */
function QuickActionsBubble({ onAction }) {
  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm flex flex-col gap-3">
      <p className="text-gray-200 text-sm">Select an action:</p>
      <div className="flex gap-3 flex-wrap">
        <button 
          onClick={() => onAction('QUOTE')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
        >
          <FileText size={16}/> Create Quote
        </button>
        <button 
          onClick={() => onAction('INVOICE')}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
        >
          <CreditCard size={16}/> Create Invoice
        </button>
      </div>
    </div>
  );
}

/**
 * INVOICE FORM BUBBLE (incorporates all fixes)
 */
function InvoiceFormBubble({ onSubmit, defaultType = 'INVOICE' }) {
  const [submitted, setSubmitted] = useState(false);
  const [docType, setDocType] = useState(defaultType); // INVOICE | QUOTE
  const [currency, setCurrency] = useState('USD');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddr, setBillingAddr] = useState(''); // FIX 1: Mandatory
  const [termsAndConditions, setTermsAndConditions] = useState("Payment due within 30 days. Late payments incur a 5% penalty."); // FIX 2: Mandatory field
  const [items, setItems] = useState([
    { id: 1, desc: 'Consulting Service', qty: 1, price: 500, taxRate: 0 }
  ]);
  
  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0, taxRate: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const lineTotal = item.qty * item.price;
      subtotal += lineTotal;
      taxAmount += lineTotal * (item.taxRate / 100);
    });
    
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleSubmit = () => {
    // Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName.trim() || !billingAddr.trim() || !termsAndConditions.trim() || !customerEmail.trim()) {
      // FIX: Use console.error instead of alert()
      console.error("Client Name, Email, Billing Address, and Terms & Conditions are mandatory.");
      return;
    }

    if (!emailPattern.test(customerEmail.trim())) {
      console.error("Please enter a valid client email address.");
      return;
    }
    if (items.some(i => !i.desc.trim() || i.price <= 0)) {
       // FIX: Use console.error instead of alert()
       console.error("All line items must have a description and a positive price.");
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
      ...totals
    });
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-bl-none text-gray-400 text-sm italic">
        ✓ {docType === 'QUOTE' ? 'Quote' : 'Invoice'} details submitted. Check the generated card above!
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg rounded-bl-none text-sm animate-in zoom-in-95 duration-300 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <span className="font-semibold text-white flex items-center gap-2">
           <Calculator size={16} className="text-blue-400"/> New Document Details
        </span>
        <div className="flex bg-gray-900 rounded-lg p-0.5">
          <button 
            onClick={() => setDocType('QUOTE')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${docType === 'QUOTE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Quote
          </button>
          <button 
             onClick={() => setDocType('INVOICE')}
             className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${docType === 'INVOICE' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Invoice
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* Customer Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase">Client Details (Mandatory fields *)</label>
          <input
            type="text" placeholder="* Client / Company Name"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={customerName} onChange={e => setCustomerName(e.target.value)}
          />
          <input
            type="email" placeholder="* Client Email"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
          />
          <input
            type="text" placeholder="GST / Tax ID (Optional)"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={gstNumber} onChange={e => setGstNumber(e.target.value)}
          />
          <textarea 
            placeholder="* Billing Address" rows="2"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            value={billingAddr} onChange={e => setBillingAddr(e.target.value)}
          />
        </div>

        {/* Line Items Section */}
        <div className="space-y-3 pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-500 uppercase">Line Items</label>
            <select 
              value={currency} onChange={e => setCurrency(e.target.value)}
              className="bg-gray-900 text-white text-xs border border-gray-700 rounded px-2 py-1"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="ADA">ADA (₳)</option>
            </select>
          </div>
          
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900/50 p-2 rounded border border-gray-700 relative group">
              <div className="flex justify-between mb-2">
                 <input 
                    type="text" placeholder="* Item Description"
                    className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm focus:border-blue-500 outline-none mr-2"
                    value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)}
                  />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400 opacity-100 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14}/>
                    </button>
                  )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Qty</label>
                  <input 
                    type="number" min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">* Price</label>
                  <input 
                    type="number" min="0.01" step="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Tax %</label>
                  <input 
                    type="number" min="0" max="100"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-xs"
                    value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Plus size={12}/> Add Item
          </button>
        </div>
        
        {/* Terms and Conditions - FIX 2 Input */}
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <label className="text-xs font-semibold text-gray-500 uppercase">* Terms & Conditions</label>
           <textarea 
            placeholder="Payment and service terms..." rows="2"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none text-xs"
            value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)}
          />
        </div>

        {/* Total Preview */}
        <div className="bg-gray-900 rounded p-3 flex justify-between items-center border border-gray-700">
          <span className="text-gray-400 text-xs">Total:</span>
          <span className="text-white font-bold text-lg">
            {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '₳'}
            {calculateTotals().total.toFixed(2)}
          </span>
        </div>

        <button 
          onClick={handleSubmit}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-colors text-white ${
            docType === 'QUOTE' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-teal-600 hover:bg-teal-500'
          }`}
        >
          Generate {docType === 'QUOTE' ? 'Quote' : 'Invoice'}
        </button>
      </div>
    </div>
  );
}

/**
 * INVOICE PREVIEW CARD (incorporates all fixes)
 */
function InvoicePreviewCard({ data, onPay, onDocumentAction, walletConnected }) {
  const { 
    id, 
    docType, 
    customerName,
    customerEmail,
    gstNumber,
    billingAddr,
    termsAndConditions, // FIX 2: Added T&C
    items, 
    currency, 
    total, 
    amountADA, 
    status, 
  } = data;
  
  const isPaid = status === 'PAID' || status === 'ACCEPTED';
  const isProcessing = status === 'PROCESSING';
  const isQuote = docType === 'QUOTE';

  const currencySymbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '₳';

  return (
    <div className="w-full max-w-md bg-white text-gray-900 rounded-sm overflow-hidden shadow-2xl transform transition-all relative">
      
      <style>{`
         /* Prevents horizontal scrolling on mobile for large cards */
         .invoice-card-container {
             max-width: 100vw;
         }
         /* Ensures text wrapping in small spaces */
         .text-wrap-break {
             word-break: break-word;
         }
      `}</style>

      {/* Decorative Top Border */}
      <div className={`h-2 w-full ${isQuote ? 'bg-blue-600' : 'bg-teal-600'}`}></div>

      <div className="p-6 md:p-8 invoice-card-container">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${isQuote ? 'bg-blue-600' : 'bg-teal-600'}`}>
                 BD
               </div>
               <span className="font-bold text-xl tracking-tight text-gray-800">Blue Dot</span>
            </div>
            <p className="text-xs text-gray-500">
              123 Blockchain Ave, Crypto City<br/>
              contact@bluedot.io
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-light text-gray-300 tracking-widest uppercase">{isQuote ? 'QUOTE' : 'INVOICE'}</h1>
            <p className="font-medium text-gray-700 mt-1">#{id}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Client Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-gray-100 py-6">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">Bill To</span>
            <h3 className="font-bold text-gray-800 text-sm text-wrap-break">{customerName}</h3>
            <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-1">
              <Mail size={12} />
              <span className="font-mono">{customerEmail}</span>
            </p>
            {gstNumber && (
              <p className="text-[10px] text-gray-600 mt-1">GST/Tax ID: <span className="font-mono">{gstNumber}</span></p>
            )}
            {/* Billing Address - FIX 1: Displaying Mandatory Field */}
            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed text-wrap-break">
              {billingAddr}
            </p>
          </div>
          <div className="text-right flex flex-col justify-between">
             <div>
               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">Total Due</span>
               <span className={`text-2xl font-bold ${isQuote ? 'text-blue-600' : 'text-teal-600'}`}>
                 {currencySymbol}{total.toFixed(2)}
               </span>
             </div>
             {isPaid && (
               <div className={`inline-block self-end px-3 py-1 rounded text-xs font-bold uppercase border ${
                 isQuote ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-teal-600 border-teal-200 bg-teal-50'
               }`}>
                 {isQuote ? 'ACCEPTED' : 'PAID'}
               </div>
             )}
          </div>
        </div>

        {/* Line Items Table (simplified for context) */}
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/2">Description</th>
                <th className="text-right py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="text-right py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2 text-sm text-gray-700 font-medium text-wrap-break">{item.desc}</td>
                  <td className="py-2 text-right text-sm text-gray-600 whitespace-nowrap">{item.qty}</td>
                  <td className="py-2 text-right text-sm text-gray-800 font-semibold whitespace-nowrap">
                    {(item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Terms and Conditions - FIX 2 Display */}
        <div className="pt-4 mb-8">
            <h4 className="font-bold text-sm text-gray-700 mb-1">Terms & Conditions</h4>
            <div className="text-xs text-gray-500 border-l-4 border-gray-200 pl-3 italic whitespace-pre-wrap rounded-r-lg bg-gray-50 p-2">
                {termsAndConditions}
            </div>
        </div>


        {/* Footer / Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Grand Total</span>
              <span className='whitespace-nowrap'>{currencySymbol}{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-blue-600 mt-1">
              <span>To Pay (ADA)</span>
              <span className='whitespace-nowrap'>{amountADA} ₳</span>
            </div>
          </div>
        </div>

        {/* Actions - FIX 3: Send to Client + Share + Pay/Accept */}
        <div className="flex flex-col gap-2 print:hidden">
          
          {/* Action Row: Send to Client & Share */}
          <div className="flex gap-2">
             <button 
                onClick={() => onDocumentAction(id, 'send')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Mail size={16}/> Send to Client
              </button>
              <button 
                onClick={() => onDocumentAction(id, 'share')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={16}/> Share Link
              </button>
          </div>

          {/* Payment Row */}
          {!isPaid ? (
            <button 
              onClick={onPay}
              disabled={isProcessing}
              className={`flex-1 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                isProcessing ? 'bg-gray-400 cursor-not-allowed' : isQuote ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} fill="white"/>
              )}
              {walletConnected ? (isQuote ? 'Accept Quote (Deposit)' : 'Pay Now (CIP-30)') : 'Connect Wallet to Pay'}
            </button>
          ) : (
             <button className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-default">
               <CheckCircle2 size={16}/> {isQuote ? 'Accepted' : 'Paid'}
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-gray-800 text-white shadow-inner' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
      }`}
    >
      <div className={`${active ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {icon}
      </div>
      <span className="hidden md:block text-sm font-medium">{label}</span>
    </button>
  );
}

function ReceiptsView({ receipts }) {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Transactions & Receipts</h1>
        <p className="text-gray-400">Immutable record of all your payments secured on the Cardano blockchain.</p>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/80">
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount (ADA)</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${receipt.type === 'INVOICE' ? 'bg-teal-900 text-teal-300' : 'bg-blue-900 text-blue-300'}`}>
                        {receipt.type || 'INVOICE'}
                     </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <CheckCircle2 size={12} />
                      {receipt.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-200 font-medium">{receipt.service}</td>
                  <td className="p-4 text-gray-400 text-sm whitespace-nowrap">{receipt.date}</td>
                  <td className="p-4 text-gray-200 font-bold font-mono whitespace-nowrap">{receipt.amount} ₳</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 group cursor-pointer">
                      <span className="text-xs font-mono text-gray-500 group-hover:text-blue-400 transition-colors truncate max-w-[120px]">
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
    </div>
  );
}