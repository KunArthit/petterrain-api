import EmailService from "./classes/EmailService";

async function testSendEmail() {
  console.log("🧪 Starting email test with configured SMTP...");
  console.log("📧 Target: ewmew11@gmail.com");
  console.log("🏢 From: dev@kitsomboon.com");
  console.log("🚀 Company: Turnkey Communication Services Public Company Limited");
  console.log("");

  // Test 1: Send payment confirmation email
  console.log("📤 Test 1: Sending payment confirmation email...");
  const success1 = await EmailService.sendPaymentConfirmationEmail(
    "ewmew11@gmail.com",
    "Test User",
    "INV-TEST-001",
    1500,
    "THB"
  );

  if (success1) {
    console.log("✅ Payment confirmation email sent successfully!");
  } else {
    console.error("❌ Failed to send payment confirmation email");
  }

  console.log("");
  
  // Test 2: Send invoice email with order items
  console.log("📤 Test 2: Sending invoice email with order items...");
  const success2 = await EmailService.sendInvoiceEmail({
    userEmail: "ewmew11@gmail.com",
    userName: "Test User",
    invoiceNo: "INV-TEST-002",
    amount: 2500,
    currency: "THB",
    orderDate: new Date(),
    paymentMethod: "Credit Card",
    orderItems: [
      {
        productName: "Smart Farm Sensor Kit",
        quantity: 2,
        unitPrice: 750,
        subtotal: 1500
      },
      {
        productName: "IoT Gateway Device",
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000
      }
    ]
  });

  if (success2) {
    console.log("✅ Invoice email sent successfully!");
  } else {
    console.error("❌ Failed to send invoice email");
  }

  console.log("");

  // Test 3: Test email configuration
  console.log("📤 Test 3: Testing email configuration...");
  const configTest = await EmailService.testEmailConfiguration();
  
  if (configTest.success) {
    console.log("✅ Email configuration test passed!");
    console.log("📧 Details:", configTest.details);
  } else {
    console.error("❌ Email configuration test failed:", configTest.message);
  }

  const allSuccess = success1 && success2 && configTest.success;
  return allSuccess;
}

// Run the test
testSendEmail()
  .then((result) => {
    console.log(`🏁 Test completed with result: ${result}`);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Test failed with error:", error);
    process.exit(1);
  });