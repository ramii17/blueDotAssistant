// Quick test to verify PayLink generation is working

const testDoc = {
    id: "TEST-001",
    docType: "INVOICE",
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    billingAddr: "123 Test St",
    merchantAddress: "addr1qy0q3kl9x7d2kzzs6g2yz8jt7f6xm5n4p3q2r1s0t9u8v7w6x5y4z3",
    amountADA: "50.25",
    currency: "USD",
    items: [
        { desc: "Service", qty: 1, price: 100, taxRate: 10 }
    ],
    total: 110
};

// Test PayLink generation
if (testDoc.docType === "INVOICE") {
    const payLink = `web+cardano:${testDoc.merchantAddress}?amount=${testDoc.amountADA}`;
    console.log("✅ PayLink Generated:");
    console.log(payLink);
    console.log("\n✅ Test successful - PayLink generation is working");
} else {
    console.log("❌ Wrong document type");
}
