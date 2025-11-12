// Demo email test - shows email generation without actual sending
async function demoEmailTest() {
  console.log("🧪 Starting email demo test...");
  console.log("📧 Target email: ewmew11@gmail.com");
  console.log("🚀 This demo will show the email content without sending");
  console.log("");

  const COMPANY_NAME = "Smart Farm";
  const invoiceNo = "INV-TEST-001";
  const userName = "Test User";
  const amount = 1500;
  const currency = "THB";

  // Generate test email HTML (same as what would be sent)
  const emailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed - ${COMPANY_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: #059669; padding: 48px 40px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #ffffff;">${COMPANY_NAME}</h1>
          
          <div style="background-color: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; display: inline-block; min-width: 280px;">
            <div style="margin-bottom: 16px;">
              <div style="background: #059669; color: white; width: 48px; height: 48px; border-radius: 12px; display: table-cell; vertical-align: middle; text-align: center; font-size: 24px; margin: 0 auto 12px;">✓</div>
            </div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1f2937;">Payment Confirmed</h2>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Your payment has been processed successfully</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px;">
          
          <!-- Greeting -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Great news, ${userName}!</h3>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0;">Your payment has been successfully processed and confirmed. Thank you for choosing our services!</p>
          </div>
          
          <!-- Payment Details Card -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
            <h3 style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">Payment Details</h3>
            
            <div style="space-y: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">Invoice Number</span>
                <span style="color: #166534; font-size: 14px; font-weight: 600; font-family: monospace;">${invoiceNo}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">Payment Status</span>
                <span style="background: #059669; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">CONFIRMED</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0 0;">
                <span style="color: #166534; font-size: 16px; font-weight: 600;">Amount Paid</span>
                <div style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-size: 18px; font-weight: 700;">
                  ${currency} ${amount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #fcd34d;">
            <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">What's Next?</h4>
            <p style="color: #78350f; font-size: 14px; line-height: 1.5; margin: 0;">You will receive a detailed invoice receipt shortly. If you have any questions, feel free to contact our support team.</p>
          </div>
          
          <!-- Footer Message -->
          <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">Thank you for your business!</p>
            <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">We appreciate your trust in our services.</p>
          </div>
          
        </div>
        
        <!-- Simple Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${COMPANY_NAME} © ${new Date().getFullYear()}</p>
        </div>
        
      </div>
    </body>
    </html>
  `;

  const emailData = {
    to: "ewmew11@gmail.com",
    subject: `✅ Payment Confirmed - ${invoiceNo} | ${COMPANY_NAME}`,
    html: emailHTML,
  };

  // Simulate development mode logging
  console.log("📧 Development mode - Email content generated successfully:");
  console.log("=" .repeat(60));
  console.log("To:", emailData.to);
  console.log("Subject:", emailData.subject);
  console.log("");
  console.log("HTML Content Preview:");
  console.log(emailData.html.substring(0, 500) + "...");
  console.log("=" .repeat(60));
  console.log("");
  console.log("✅ Email content generation successful!");
  console.log("📧 In production with SMTP configured, this would be sent to ewmew11@gmail.com");
  console.log("");
  console.log("🔧 To actually send emails, configure:");
  console.log("   • SMTP_USER=your-gmail@gmail.com");
  console.log("   • SMTP_PASS=your-gmail-app-password");
  console.log("   • Enable 2FA and generate App Password in Gmail settings");

  return true;
}

// Run the demo
demoEmailTest()
  .then(() => {
    console.log("");
    console.log("🎉 Demo completed successfully!");
  })
  .catch((error) => {
    console.error("💥 Demo failed:", error);
  });