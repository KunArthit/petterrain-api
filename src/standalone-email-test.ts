import nodemailer from "nodemailer";

// Standalone email test without config dependencies
async function testEmailDirectly() {
  console.log("🧪 Starting standalone email test...");

  // Mock SMTP configuration (replace with actual values for testing)
  const SMTP_CONFIG = {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "your-email@gmail.com", // Set this environment variable
      pass: process.env.SMTP_PASS || "your-app-password",   // Set this environment variable
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2" as const,
    },
  };

  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@smartfarm.com";
  const COMPANY_NAME = "Smart Farm";

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify SMTP connection
    console.log("🔐 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");

    // Create test email HTML
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
              <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Great news, Test User!</h3>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0;">This is a test email to verify the email service configuration is working correctly.</p>
            </div>
            
            <!-- Payment Details Card -->
            <div style="background: #f0fdf4; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
              <h3 style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">Test Details</h3>
              
              <div style="space-y: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #166534; font-size: 14px; font-weight: 500;">Test ID</span>
                  <span style="color: #166534; font-size: 14px; font-weight: 600; font-family: monospace;">TEST-EMAIL-001</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #166534; font-size: 14px; font-weight: 500;">Timestamp</span>
                  <span style="color: #166534; font-size: 14px; font-weight: 600;">${new Date().toLocaleString()}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0 0;">
                  <span style="color: #166534; font-size: 16px; font-weight: 600;">Status</span>
                  <div style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-size: 18px; font-weight: 700;">
                    SUCCESS
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer Message -->
            <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">This is a test email to verify email configuration.</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">Email service is working correctly!</p>
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

    // Send email
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to: "ewmew11@gmail.com",
      subject: `✅ Email Test - ${new Date().toISOString()}`,
      html: emailHTML,
      text: "This is a test email to verify SMTP configuration is working correctly.",
    };

    console.log("📨 Sending test email to ewmew11@gmail.com...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Test email sent successfully!");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to send test email:", error);
    
    if (error instanceof Error) {
      console.error("❌ Error details:", {
        message: error.message,
        code: (error as any).code,
      });

      // Provide guidance
      if (error.message.includes("authentication") || error.message.includes("Invalid login")) {
        console.error("💡 Please ensure:");
        console.error("   1. Set SMTP_USER environment variable to your Gmail address");
        console.error("   2. Set SMTP_PASS environment variable to your Gmail App Password");
        console.error("   3. Enable 2-Factor Authentication on Gmail");
        console.error("   4. Generate App Password from Google Account Settings");
      }
    }
    
    return false;
  }
}

// Run the test
console.log("🚀 Email configuration test starting...");
console.log("📧 Target email: ewmew11@gmail.com");
console.log("⚙️  Make sure to set SMTP_USER and SMTP_PASS environment variables");
console.log("");

testEmailDirectly()
  .then((success) => {
    if (success) {
      console.log("");
      console.log("🎉 Test completed successfully!");
      console.log("📧 Check ewmew11@gmail.com for the test email");
    } else {
      console.log("");
      console.log("💥 Test failed");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });