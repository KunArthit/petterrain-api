// Simple script to run email test with environment variables
import { $ } from "bun";

// Set environment variables from your .env configuration
process.env.SMTP_HOST = "smtp.gmail.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "arthit@kitsomboon.com";
process.env.SMTP_PASS = "nvkd fksv qrub nnlh";
process.env.FROM_EMAIL = "arthit@kitsomboon.com";
process.env.COMPANY_NAME = "Turnkey Communication Services Public Company Limited";
process.env.NODE_ENV = "production"; // Force production mode to use SMTP

// Set required database vars to dummy values to pass validation
process.env.MYSQL_DB = "dummy";
process.env.MYSQL_USER = "dummy";
process.env.MYSQL_PASSWORD = "dummy";

console.log("🔧 Environment variables set for email testing");
console.log("📧 SMTP_USER:", process.env.SMTP_USER);
console.log("🏢 FROM_EMAIL:", process.env.FROM_EMAIL);
console.log("🚀 COMPANY_NAME:", process.env.COMPANY_NAME);
console.log("");

// Import and run the test
import("./src/test-email.ts");