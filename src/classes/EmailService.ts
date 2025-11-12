import axios from "axios";
import nodemailer from "nodemailer";
import { env } from "../core/config";

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded content
  contentType: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

interface InvoiceEmailData {
  userEmail: string;
  userName: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  orderItems?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  orderDate: Date;
  paymentMethod: string;
}

export interface OrderEmailData {
  order_id: number;
  invoice_no: string;
  user_id: number;
  user_email: string;
  order_status: string;
  user_name: string;
  address: string;
  is_bulk_order: number;
  bulk_order_type: string;
  payment_method: string;
  subtotal: string;
  shipping_cost: string;
  tax_amount: string;
  total_amount: string;
  tracking_number: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  phone: string;
  orderItems?: Array<{
    image: string;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

class EmailService {
  private static readonly SMTP_CONFIG = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
      minVersion: "TLSv1.2" as const,
    },
    debug: true, // Enable debug output
    logger: true, // Enable logging
  };

  private static readonly FROM_EMAIL = env.FROM_EMAIL;
  private static readonly COMPANY_NAME = env.COMPANY_NAME;

  /**
   * Send email using SMTP or external email service
   */
  private static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Check if SMTP is configured
      const smtpConfigured = env.SMTP_USER && env.SMTP_PASS;
      const emailServiceUrl = env.EMAIL_SERVICE_URL;
      const isDevelopment = env.NODE_ENV === "development";

      // Priority 1: Use SMTP if configured
      if (smtpConfigured) {
        return await this.sendEmailViaSMTP(emailData);
      }

      // Priority 2: Use external email service if configured
      if (emailServiceUrl) {
        return await this.sendEmailViaService(emailData, emailServiceUrl);
      }

      // Priority 3: Development mode - log email
      if (isDevelopment) {
        console.log(
          "📧 Development mode - No email service configured, logging email instead:"
        );
        console.log("To:", emailData.to);
        console.log("Subject:", emailData.subject);
        console.log(
          "HTML Content Preview:",
          emailData.html.substring(0, 200) + "..."
        );
        return true; // Return true for development/testing
      }

      // Production mode without any email configuration
      console.error("❌ Production mode - No email service configured");
      console.error(
        `📧 SMTP Status: USER=${env.SMTP_USER ? "SET" : "MISSING"}, PASS=${
          env.SMTP_PASS ? "SET" : "MISSING"
        }`
      );
      console.error(
        "💡 Configure SMTP: Set SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT"
      );
      return false;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send email via SMTP using nodemailer
   */
  private static async sendEmailViaSMTP(
    emailData: EmailData
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending email via SMTP to ${emailData.to}`);
      console.log(`📧 SMTP Config:`, {
        host: this.SMTP_CONFIG.host,
        port: this.SMTP_CONFIG.port,
        secure: this.SMTP_CONFIG.secure,
        user: this.SMTP_CONFIG.auth.user,
        from: this.FROM_EMAIL,
      });

      // Create transporter
      const transporter = nodemailer.createTransport(this.SMTP_CONFIG);

      console.log(`🔐 Verifying SMTP connection...`);
      // Verify SMTP connection
      await transporter.verify();
      console.log(`✅ SMTP connection verified successfully`);

      console.log(`📨 Sending email...`);
      // Send email with enhanced configuration
      const mailOptions = {
        from: `"${this.COMPANY_NAME}" <${this.FROM_EMAIL}>`, // Enhanced from field
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.html.replace(/<[^>]*>?/gm, ""), // Add plain text version
        attachments: emailData.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          encoding: "base64",
          contentType: att.contentType,
        })),
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent via SMTP successfully to ${emailData.to}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📧 Response: ${info.response}`);
      console.log(`📧 Envelope: ${JSON.stringify(info.envelope)}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send email via SMTP:", error);
      if (error instanceof Error) {
        console.error("❌ Error details:", {
          message: error.message,
          code: (error as any).code,
          command: (error as any).command,
          response: (error as any).response,
          responseCode: (error as any).responseCode,
          stack: error.stack,
        });

        // Provide specific guidance for common Gmail errors
        if (error.message.includes("Invalid login")) {
          console.error("💡 Gmail Error: Invalid login - Check if:");
          console.error("   1. Email and password are correct");
          console.error(
            "   2. 2-Factor Authentication is enabled and App Password is used"
          );
          console.error(
            "   3. Less secure app access is enabled (not recommended)"
          );
        }

        if (error.message.includes("authentication")) {
          console.error("💡 Authentication Error - Gmail Setup Required:");
          console.error("   1. Enable 2-Factor Authentication on Gmail");
          console.error(
            "   2. Generate App Password: Google Account > Security > App passwords"
          );
          console.error(
            "   3. Use the App Password in SMTP_PASS (not your regular password)"
          );
        }

        if (
          (error as any).code === "ECONNECTION" ||
          (error as any).code === "ETIMEDOUT"
        ) {
          console.error("💡 Connection Error - Check:");
          console.error("   1. Internet connectivity");
          console.error("   2. Firewall settings (allow port 587)");
          console.error("   3. Gmail SMTP server accessibility");
        }
      }
      return false;
    }
  }

  /**
   * Send email via external service (SendGrid, Mailgun, etc.)
   */
  private static async sendEmailViaService(
    emailData: EmailData,
    emailServiceUrl: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending email via external service to ${emailData.to}`);

      // Check if using SendGrid API format
      const isSendGrid = emailServiceUrl.includes("sendgrid");

      let requestData;
      let headers;

      if (isSendGrid) {
        // SendGrid API format
        requestData = {
          personalizations: [
            {
              to: [{ email: emailData.to }],
              subject: emailData.subject,
            },
          ],
          from: { email: this.FROM_EMAIL },
          content: [
            {
              type: "text/html",
              value: emailData.html,
            },
          ],
        };
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.EMAIL_SERVICE_API_KEY}`,
        };
      } else {
        // Generic format (for custom webhook or other services)
        requestData = {
          from: this.FROM_EMAIL,
          ...emailData,
        };
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.EMAIL_SERVICE_API_KEY}`,
        };
      }

      const response = await axios.post(emailServiceUrl, requestData, {
        headers,
        timeout: 30000,
      });

      if (response.status >= 200 && response.status < 300) {
        console.log(
          `✅ Email sent via external service successfully to ${emailData.to}`
        );
        return true;
      }

      throw new Error(`Email service returned status: ${response.status}`);
    } catch (error) {
      console.error("❌ Failed to send email via external service:", error);
      return false;
    }
  }

  /**
   * Generate modern clean HTML template for invoice email
   */
  private static generateInvoiceEmailHTML(data: InvoiceEmailData): string {
    const itemsTable =
      data.orderItems && data.orderItems.length > 0
        ? `
      <div style="margin: 32px 0;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Order Items</h3>
        <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Product</th>
                <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Qty</th>
                <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
                <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${data.orderItems
                .map(
                  (item, index) => `
                <tr style="border-bottom: ${
                  index === data.orderItems!.length - 1
                    ? "none"
                    : "1px solid #f3f4f6"
                };">
                  <td style="padding: 16px; color: #374151; font-size: 14px;">${
                    item.productName
                  }</td>
                  <td style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">${
                    item.quantity
                  }</td>
                  <td style="padding: 16px; text-align: right; color: #6b7280; font-size: 14px;"><strong>${
                    data.currency
                  }</strong> ${item.unitPrice.toLocaleString("th-TH")}</td>
                  <td style="padding: 16px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;"><strong>${
                    data.currency
                  }</strong> ${item.subtotal.toLocaleString("th-TH")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
        : "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light only">
      <title>Invoice ${data.invoiceNo} - ${this.COMPANY_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: #059669; padding: 48px 40px; text-align: center;">
          <!-- Optional logo -->
          <!--<img src="https://example.com/logo.png" alt="Company Logo" style="height: 48px; margin-bottom: 20px;" />-->
          <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #ffffff;">${
            this.COMPANY_NAME
          }</h1>
          
          <div style="background-color: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; display: inline-block; min-width: 280px;">
  <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1f2937;">Invoice Receipt</h2>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">Your payment has been processed successfully</p>
</div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px;">
          
          <!-- Greeting -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Great news, ${
              data.userName
            }!</h3>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0;">Your payment has been successfully processed and confirmed. Thank you for choosing our services!</p>
          </div>
          
          <!-- Payment Details -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
            <h3 style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">Payment Details</h3>
            <div style="space-y: 16px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">Invoice Number</span>
                <span style="color: #166534; font-size: 14px; font-weight: 600; font-family: monospace;">${
                  data.invoiceNo
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">Order Date</span>
                <span style="color: #166534; font-size: 14px; font-weight: 600;">${data.orderDate.toLocaleDateString(
                  "th-TH"
                )}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">Payment Method</span>
                <span style="color: #166534; font-size: 14px; font-weight: 600;">${
                  data.paymentMethod
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; gap: 12px;">
  <span style="color: #166534; font-size: 16px; font-weight: 600;">Amount Paid</span>
  <div style="
   
    color: white;
    padding: 12px 24px;

    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
    max-width: 200px;
    text-align: right;
    flex-shrink: 0;
  ">
    ${data.currency} ${data.amount.toLocaleString("th-TH")}
  </div>
</div>
            </div>
          </div>

          ${itemsTable}

          <!-- Footer -->
          <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">This is an automated receipt. Please save this email for your records.</p>
            <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">Thank you for your business!</p>
          </div>
        </div>

        <!-- Footer Bar -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${
            this.COMPANY_NAME
          } © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  }

  // order message
  private static ordersTransaction(data: OrderEmailData): string {
    const productRows = data.orderItems
      ?.map(
        (item) => `
        <tr>
          <td style="padding: 8px; display: flex; align-items: center;">
            <img src="${item.image}" alt="product image"
                style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border: 1px solid #ccc;">
            <div>
              ${item.productName}<br>
              <small>รหัสสินค้า: ${item.productId}</small>
            </div>
          </td>
          <td style="padding: 8px; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right;">${item.subtotal.toLocaleString(
            "th-TH",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} บาท</td>
        </tr>
      `
      )
      .join("");

    const cardCheck = () => {
      if (!data.tracking_number || data.tracking_number === null) {
        return `
          <table
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            style="background-color: rgb(226, 225, 225); border-radius: 12px; font-size: 12px; padding: 10px; margin-top: 20px;"
          >
            <tr>
              <!-- รูปแบบการส่งสินค้า -->
              <td width="33%" valign="top" style="padding: 10px;">
                <b style="color: grey;">รูปแบบการส่งสินค้า</b><br />
                <b>ส่งแบบ EMS แจ้งโอนก่อน 14:00 จันทร์-ศุกร์ และ 10:00 วันเสาร์ ส่งทันทีวันเดียวกัน 1500 บาทส่งฟรี</b>
              </td>

              <!-- ร้านจะส่งสินค้าภายใน -->
              <td width="33%" valign="top" style="padding: 10px;">
                <b style="color: grey;">ร้านจะส่งสินค้าภายใน</b><br />
                <b>1 วัน</b>
              </td>

              <!-- ลิงก์ดูรายการสั่งซื้อ -->
              <td width="33%" valign="top" style="padding: 10px;">
                <div style="padding: 8px; border-radius: 8px;">
                  <a
                    href="${process.env.FRONT_RETURN_URL}/my-account-orders-details?id=${data.order_id}"
                    style="color: rgb(106, 106, 246); text-decoration: none;"
                  >
                    ดูรายการสั่งซื้อ
                  </a>
                </div>
              </td>
            </tr>
          </table>
        
        `;
      } else {
        return `
          <table
            width="100%"
            cellpadding="10"
            cellspacing="0"
            style="background-color: rgb(226, 225, 225); border-radius: 12px; font-size: 12px;">
            <tr>
              <td width="33%" valign="top" style="padding: 10px;">
                <b style="color: grey;">รูปแบบการส่งสินค้า</b><br />
                <span><b>Thailand Post</b></span>
              </td>
              <td width="33%" valign="top" style="padding: 10px;">
                <b style="color: grey;">ส่งเมื่อ</b><br />
                <b>${formatThDateTime(data.updated_at)}</b>
              </td>
              <td width="33%" valign="top" style="padding: 10px;">
                <b style="color: grey;">รหัสพัสดุ</b><br />
                <div
                  style="background-color: cyan; padding: 8px; border-radius: 8px; display: inline-block;">
                  <b style="color: white;">${data.tracking_number}</b>
                </div>
              </td>
            </tr>
          </table>
        `;
      }
    };

    const headParagraph = () => {
      if (!data.tracking_number || data.tracking_number === null) {
        return `
                    <div
                        style="
                      display: flex;
                      flex-direction: row;
                      margin-top: 20px;
                      align-items: center;
                    ">
                        <div>
                            <h4>ร้านกำลังเตรียมจัดส่งสินค้าให้กับคุณ</h4>
                            <p>
                                รายการสั่งซื้อของคุณคือ <span><b>${data.order_id}</b> [<span style="color: grey;">รอจัดส่ง</span>]</span>
                                ได้รับการยืนยันการชำระเงินแล้ว
                                คุณจะได้รับอีเมลแจ้งเตือนอีกครั้งเมื่อสินค้าได้ถูกจัดส่งจากร้านค้าแล้ว
                            </p>
                        </div>
                    </div>
        
        `;
      } else {
        return `
              <div
                            style="
                    display: flex;
                    flex-direction: row;
                    margin-top: 20px;
                    align-items: center;
                ">
                    <div>
                        <h4>ร้านค้าได้จัดส่งสินค้าเรียบร้อยแล้ว</h4>
                        <p>
                            รายการสั่งซื้อของคุณคือ <span><b>${data.order_id}</b> [<span style="color: grey;">จัดส่งแล้ว</span>]</span>
                            คุณสามารถตรวจสอบสถานะการจัดส่งได้ โดยคลิกที่เลขพัสดุด้านล่าง
                        </p>
                    </div>
                </div>
        `;
      }
    };

    return `
   <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Orders Confirmed </title>
        </head>
        <body
            style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            sans-serif;
        ">
            <div
                style="
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          ">
                <div style="padding: 40px">
                    

                     <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdhRBpH4IIU7kra8NgG6-91VNrfuoWevpXjg&s" width="125px" /></td>
                            <td>
                                <h3>Turnkey Communication Services Public Company Limited</h3>
                                <p>รหัสสินค้า ${data.invoice_no}</p>
                            </td>
                        </tr>
                    </table>

                    ${headParagraph()}

                    ${cardCheck()}

                    <div
                        style="font-size: 14px; width: 50%; color: grey; margin-top: 20px;">
                        <b>ที่อยู่สำหรับจัดส่ง</b>
                        <p>${data.user_name}</p>
                        <p>${data.address}</p>
                        <p>เบอร์โทร ${data.phone}</p>
                    </div>

                    <!-- รายการสินค้า -->
                    <div style="margin-top: 20px;">
                        <b style="font-size: 16px;">รายการสินค้า</b>
                        <table
                            style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                            <thead>
                                <tr style="color: grey;">
                                    <th
                                        style="padding: 8px; text-align: left;">สินค้า</th>
                                    <th
                                        style="padding: 8px; text-align: center;">จำนวน</th>
                                    <th
                                        style="padding: 8px; text-align: right;">ราคารวม
                                        (บาท)</th>
                                </tr>
                            </thead>
                            <tbody>

                                <!-- ตัวอย่างแถวสินค้าพร้อมรูป -->
                                ${productRows || ""}

                            </tbody>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                          <tr>
                            <td align="right">
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="width: 300px; font-size: 14px; border-collapse: collapse;"
                              >
                                <tr>
                                  <td style="padding: 8px; color: grey;">ราคาสินค้าทั้งหมด</td>
                                  <td style="padding: 8px; text-align: right;">
                                    ${Number(data.subtotal).toLocaleString(
                                      "th-TH",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )} บาท
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px; color: grey;">ค่าจัดส่งสินค้า</td>
                                  <td style="padding: 8px; text-align: right;">
                                    + ${Number(
                                      data.shipping_cost
                                    ).toLocaleString("th-TH", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })} บาท
                                  </td>
                                </tr>
                                 <tr>
                                  <td style="padding: 8px; color: grey;">ภาษี</td>
                                  <td style="padding: 8px; text-align: right;">
                                    + ${Number(data.tax_amount).toLocaleString(
                                      "th-TH",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )} บาท
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px; font-weight: bold;">ราคารวมทั้งหมด</td>
                                  <td style="padding: 8px; font-weight: bold; text-align: right;">
                                    ${Number(data.total_amount).toLocaleString(
                                      "th-TH",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )} บาท
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 30px;">
                      <tr>
                        <td align="center">
                          <p style="font-size: 14px; color: #333333; margin: 0 0 10px 0;">
                            ขอขอบคุณที่อุดหนุนและใช้บริการกับเรา
                          </p>

                          <table cellpadding="0" cellspacing="0" border="0" style="background-color: #a9a9a9; padding: 10px 20px;">
                            <tr>
                              <td>
                                <strong style="font-size: 14px; color: #ffffff;">
                                  Turnkey Communication Services Public Company Limited
                                </strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                </div>

            </body>
  </html>

  `;
  }

  /**
   * Send invoice email to customer
   */
  static async sendInvoiceEmail(
    invoiceData: InvoiceEmailData
  ): Promise<boolean> {
    try {
      console.log(
        `📧 Preparing to send invoice email for ${invoiceData.invoiceNo} to ${invoiceData.userEmail}`
      );

      const emailHTML = this.generateInvoiceEmailHTML(invoiceData);

      const emailData: EmailData = {
        to: invoiceData.userEmail,
        subject: `Invoice Receipt - ${invoiceData.invoiceNo} | ${this.COMPANY_NAME}`,
        html: emailHTML,
      };

      const success = await this.sendEmail(emailData);

      if (success) {
        console.log(
          `✅ Invoice email sent successfully for ${invoiceData.invoiceNo}`
        );
      } else {
        console.error(
          `❌ Failed to send invoice email for ${invoiceData.invoiceNo}`
        );
      }

      return success;
    } catch (error) {
      console.error("❌ Error in sendInvoiceEmail:", error);
      return false;
    }
  }

  static async sendOrderTransaction(
    invoiceData: OrderEmailData
  ): Promise<boolean> {
    try {
      const emailHTML = this.ordersTransaction(invoiceData);

      const emailData: EmailData = {
        to: invoiceData.user_email,
        subject: `Invoice Receipt - Order Transaction`,
        html: emailHTML,
      };

      const success = await this.sendEmail(emailData);

      if (success) {
        console.log(`✅ Invoice email sent successfully for `);
      } else {
        console.error(`❌ Failed to send invoice email for`);
      }

      return success;
    } catch (error) {
      console.error("❌ Error in sendInvoiceEmail:", error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log(`🧪 Testing email configuration...`);

      const testEmailData = {
        to: this.FROM_EMAIL, // Send test email to ourselves
        subject: `Email Test - ${new Date().toISOString()}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="background: #f9fafb; padding: 40px; border-radius: 12px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0;">Email Configuration Test</h2>
              <p style="color: #6b7280; margin: 0 0 16px 0;">This is a test email to verify SMTP configuration.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${
                  this.FROM_EMAIL
                }</p>
                <p style="margin: 0;"><strong>Company:</strong> ${
                  this.COMPANY_NAME
                }</p>
              </div>
              <p style="color: #059669; margin: 16px 0 0 0; font-weight: 600;">✅ Email configuration is working correctly!</p>
            </div>
          </div>
        `,
      };

      const success = await this.sendEmail(testEmailData);

      if (success) {
        return {
          success: true,
          message: "Email configuration test successful",
          details: {
            smtp_host: this.SMTP_CONFIG.host,
            smtp_port: this.SMTP_CONFIG.port,
            from_email: this.FROM_EMAIL,
            test_recipient: testEmailData.to,
          },
        };
      } else {
        return {
          success: false,
          message: "Email configuration test failed",
        };
      }
    } catch (error) {
      console.error("❌ Email configuration test error:", error);
      return {
        success: false,
        message: "Email configuration test error",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send modern clean payment confirmation email
   */
  static async sendPaymentConfirmationEmail(
    userEmail: string,
    userName: string,
    invoiceNo: string,
    amount: number,
    currency: string = "THB"
  ): Promise<boolean> {
    try {
      const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light only">
        <title>Payment Confirmed - ${this.COMPANY_NAME}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: #059669; padding: 48px 40px; text-align: center;">
            <!-- Optional logo -->
            <!--<img src="https://example.com/logo.png" alt="Company Logo" style="height: 48px; margin-bottom: 20px;" />-->
            <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #ffffff;">${
              this.COMPANY_NAME
            }</h1>
            
            <div style="background-color: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; display: inline-block; min-width: 280px;">

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
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #166534; font-size: 14px; font-weight: 500;">Invoice Number</span>
                  <span style="color: #166534; font-size: 14px; font-weight: 600; font-family: monospace;">${invoiceNo}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #166534; font-size: 14px; font-weight: 500;">Payment Status</span>
                  <span style="background: #059669; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">CONFIRMED</span>
                </div>
               <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 12px;">
  <span style="color: #166534; font-size: 16px; font-weight: 600;">Amount Paid</span>
  <div style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-size: 18px; font-weight: 700; white-space: nowrap; max-width: 200px">
    <strong>${currency}</strong> ${amount.toLocaleString("th-TH")}
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
            <p style="margin: 0; font-size: 14px; color: #6b7280;">${
              this.COMPANY_NAME
            } © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

      const emailData: EmailData = {
        to: userEmail,
        subject: `✅ Payment Confirmed - ${invoiceNo} | ${this.COMPANY_NAME}`,
        html: emailHTML,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error("❌ Error in sendPaymentConfirmationEmail:", error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    userEmail: string,
    resetUrl: string
  ): Promise<boolean> {
    try {
      const emailHTML = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Password Reset Request</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">You requested a password reset for your account.</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Click the link below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
        </div>
      `;

      const emailData: EmailData = {
        to: userEmail,
        subject: `Password Reset Request - ${this.COMPANY_NAME}`,
        html: emailHTML,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error("❌ Error in sendPasswordResetEmail:", error);
      return false;
    }
  }

  /**
   * Send modern clean payment failure email
   */
  static async sendPaymentFailureEmail(
    userEmail: string,
    userName: string,
    invoiceNo: string,
    amount: number,
    currency: string = "THB",
    reason: string = "Payment processing failed"
  ): Promise<boolean> {
    try {
      const emailHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed - ${this.COMPANY_NAME}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: #dc2626; padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #ffffff;">${
                this.COMPANY_NAME
              }</h1>
              
             <div style="background-color: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; display: inline-block; min-width: 280px;">
                <div style="margin-bottom: 16px; text-align: center;">
                  <div style="
                    background: #dc2626;
                    color: white;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin: 0 auto 12px;
                  ">
                    ✕
                  </div>
                </div>
                <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1f2937;">Payment Failed</h2>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">We encountered an issue processing your payment</p>
              </div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px;">
              
              <!-- Greeting -->
              <div style="margin-bottom: 40px;">
                <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hi ${userName},</h3>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0;">We encountered an issue while processing your payment. Don't worry - this happens sometimes and can usually be resolved quickly.</p>
              </div>
              
              <!-- Payment Details Card -->
              <div style="background: #fef2f2; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #fecaca;">
                <h3 style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">Payment Details</h3>
                
                <div style="space-y: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #fecaca;">
                    <span style="color: #991b1b; font-size: 14px; font-weight: 500;">Invoice Number</span>
                    <span style="color: #991b1b; font-size: 14px; font-weight: 600; font-family: monospace;">${invoiceNo}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #fecaca;">
                    <span style="color: #991b1b; font-size: 14px; font-weight: 500;">Payment Status</span>
                    <span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">FAILED</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #fecaca;">
                    <span style="color: #991b1b; font-size: 14px; font-weight: 500;">Reason</span>
                    <span style="color: #991b1b; font-size: 14px; font-weight: 500;">${reason}</span>
                  </div>
                  
               <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; gap: 12px;">
  <span style="color: #991b1b; font-size: 16px; font-weight: 600;">Amount</span>
  <div style="
    background: #dc2626;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
    max-width: 200px;
    text-align: right;
    flex-shrink: 0;
  ">
    ${currency} ${amount.toLocaleString("th-TH")}
  </div>
</div>
                </div>
              </div>
              
              <!-- Next Steps -->
              <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #fcd34d;">
                <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">What to do next:</h4>
                <ul style="color: #78350f; font-size: 14px; line-height: 1.5; margin: 0; padding-left: 16px;">
                  <li style="margin-bottom: 8px;">Check your payment method details and try again</li>
                  <li style="margin-bottom: 8px;">Ensure you have sufficient funds available</li>
                  <li style="margin-bottom: 8px;">Contact your bank if the issue persists</li>
                  <li style="margin-bottom: 0;">You can retry the payment using the same invoice number</li>
                </ul>
              </div>
              
              <!-- Support Section -->
              <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb;">
                <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Need Help?</h4>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">If you continue to experience issues, our support team is here to help you resolve this quickly.</p>
                <div style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 14px; font-weight: 600;">Contact Support</div>
              </div>
              
            </div>
            
            <!-- Simple Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">${
                this.COMPANY_NAME
              } © ${new Date().getFullYear()}</p>
            </div>
            
          </div>
        </body>
        </html>
      `;

      const emailData: EmailData = {
        to: userEmail,
        subject: `❌ Payment Failed - ${invoiceNo} | ${this.COMPANY_NAME}`,
        html: emailHTML,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error("❌ Error in sendPaymentFailureEmail:", error);
      return false;
    }
  }
}

const formatThDateTime = (input: string) => {
  const date = new Date(
    new Date(input).toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const buddhistYear = date.getFullYear() + 543;

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = buddhistYear;

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
};

export default EmailService;
