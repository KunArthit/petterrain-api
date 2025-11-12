import { Elysia, t } from "elysia";
import axios from "axios";
import jwt, { decode } from "jsonwebtoken";
import OrderService from "../classes/OrderClass";
import OrderItemClass from "@/classes/OrderItemClass";
import PaymentTransactionService from "../classes/2c2pClass";
import ProductService from "../classes/ProductsClass";
import InvoiceEmailHelper from "../classes/InvoiceEmailHelper";
import { ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";
import invoiceController from "./InvoiceController";
import InvoiceClass from "@/classes/InvoiceClass";

// Define types
type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "failed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentMethod = "cod" | "bank_transfer" | "credit_card";

type BulkOrderType = "solution" | "equipment";

type PaymentStatus = "pending" | "completed" | "failed";

// === Environment Variables ===
const merchantId = process.env.MERCHANT_ID!;
const secretKey = process.env.SECRET_KEY_2!;
const environment = process.env.ENVIRONMENT || "sandbox";

// === API URLs ===
const getBaseUrl = () => {
  return environment === "production"
    ? "https://pgw.2c2p.com"
    : "https://sandbox-pgw.2c2p.com";
};

// === Helper Functions ===
const createJWTPayload = (data: any) => {
  return jwt.sign(data, secretKey, { algorithm: "HS256" });
};

const decodeJWTPayload = (token: string) => {
  try {
    return jwt.verify(token, secretKey, { algorithms: ["HS256"] });
  } catch (error) {
    throw new Error("Invalid JWT token");
  }
};

const validateAmount = (amount: string | number): number => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Invalid amount");
  }
  return numAmount;
};

// === Enhanced Business Logic Helper Functions ===
async function processSuccessfulPayment(
  invoiceNo: string,
  paymentDetails: any
) {
  try {
    console.log(`✅ Processing successful payment for invoice ${invoiceNo}`);

    // Get order details with items
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);
    if (!order) {
      throw new Error(`Order not found for invoice: ${invoiceNo}`);
    }

    // 1. Log payment transaction
    await PaymentTransactionService.createPaymentLog({
      order_id: order.order_id,
      amount: paymentDetails.amount_paid,
      payment_method: "credit_card",
      transaction_status: "completed",
      transaction_reference: paymentDetails.transaction_ref,
      payment_date: new Date(paymentDetails.payment_date || new Date()),
      notes: `2C2P Payment Success - ${
        paymentDetails.approval_code
          ? `Approval: ${paymentDetails.approval_code}`
          : ""
      }`,
    });

    // 2. Reduce stock quantities for order items
    if (order.items && order.items.length > 0) {
      const stockUpdates = await ProductService.reduceStockForMultipleProducts(
        order.items.map((item: { product_id: any; quantity: any }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      );

      console.log(`📦 Stock reduced for ${stockUpdates.length} products`);
    }

    // 3. Send confirmation email
    await sendOrderConfirmationEmail(invoiceNo);

    // 4. Initiate shipping process
    await initiateShippingProcess(invoiceNo);

    console.log(`🎉 Successfully processed payment for ${invoiceNo}`);
  } catch (error) {
    console.error(
      `❌ Error processing successful payment for ${invoiceNo}:`,
      error
    );
    throw error;
  }
}

async function processFailedPayment(invoiceNo: string, paymentDetails: any) {
  try {
    console.log(`❌ Processing failed payment for invoice ${invoiceNo}`);

    // Get order details
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);
    if (!order) {
      throw new Error(`Order not found for invoice: ${invoiceNo}`);
    }

    // 1. Log payment transaction
    await PaymentTransactionService.createPaymentLog({
      order_id: order.order_id,
      amount: paymentDetails.amount || 0,
      payment_method: "credit_card",
      transaction_status: "failed",
      transaction_reference: paymentDetails.transaction_ref || invoiceNo,
      payment_date: new Date(),
      notes: `2C2P Payment Failed - ${
        paymentDetails.notes || "Payment unsuccessful"
      }`,
    });

    // 2. Send failure notification
    await sendPaymentFailureEmail(invoiceNo);

    // 3. Release reserved inventory (if you have inventory reservation system)
    await releaseInventoryForOrder(invoiceNo);

    console.log(`📧 Failed payment processed for ${invoiceNo}`);
  } catch (error) {
    console.error(
      `❌ Error processing failed payment for ${invoiceNo}:`,
      error
    );
    throw error;
  }
}

async function sendOrderConfirmationEmail(invoiceNo: string) {
  try {
    console.log(`📧 Sending payment confirmation email for ${invoiceNo}`);

    // Get order details with customer info
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

    if (!order) {
      throw new Error(`Order not found for invoice: ${invoiceNo}`);
    }

    // Send payment confirmation email using InvoiceEmailHelper
    const confirmationResult =
      await InvoiceEmailHelper.sendPaymentConfirmationForOrder({
        orderId: order.order_id,
        invoiceNo: order.invoice_no,
        amount: order.total_amount,
        currency: "THB",
      });

    if (confirmationResult.success) {
      console.log(
        `✅ Payment confirmation email sent successfully for ${invoiceNo}`
      );
    } else {
      console.error(
        `❌ Failed to send payment confirmation email: ${confirmationResult.message}`
      );
      throw new Error(`Email sending failed: ${confirmationResult.message}`);
    }
  } catch (error) {
    console.error(
      `❌ Error sending confirmation email for ${invoiceNo}:`,
      error
    );
    throw error;
  }
}

async function sendPaymentFailureEmail(invoiceNo: string) {
  try {
    console.log(`📧 Sending payment failure email for ${invoiceNo}`);

    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

    if (!order) {
      throw new Error(`Order not found for invoice: ${invoiceNo}`);
    }

    // Import EmailService dynamically to avoid circular dependencies
    const EmailService = (await import("../classes/EmailService")).default;

    // Get customer information
    const customerName =
      `${order.customer_first_name || ""} ${
        order.customer_last_name || ""
      }`.trim() || "Customer";
    const customerEmail = order.customer_email;

    if (!customerEmail) {
      console.warn(`⚠️ No customer email found for invoice ${invoiceNo}`);
      return;
    }

    // Send payment failure email
    const emailSent = await EmailService.sendPaymentFailureEmail(
      customerEmail,
      customerName,
      invoiceNo,
      order.total_amount,
      "THB",
      "Payment processing was unsuccessful"
    );

    if (emailSent) {
      console.log(
        `✅ Payment failure email sent successfully for ${invoiceNo}`
      );
    } else {
      console.error(`❌ Failed to send payment failure email for ${invoiceNo}`);
      throw new Error("Failed to send payment failure email");
    }
  } catch (error) {
    console.error(`❌ Error sending failure email for ${invoiceNo}:`, error);
    throw error;
  }
}

async function updateInventoryForOrder(invoiceNo: string) {
  try {
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

    if (!order || !order.items) {
      return;
    }

    // Update inventory for each item (legacy function - now using ProductService)
    for (const item of order.items) {
      console.log(
        `📦 Inventory updated for ${item.product_id} by ${item.quantity}`
      );
    }
  } catch (error) {
    console.error("Error updating inventory:", error);
    throw error;
  }
}

async function releaseInventoryForOrder(invoiceNo: string) {
  try {
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

    if (!order || !order.items) {
      return;
    }

    // Release reserved inventory for each item
    for (const item of order.items) {
      // Replace with your inventory service
      // await inventoryService.releaseReservation(item.product_id, item.quantity);
      console.log(
        `📦 Would release inventory reservation for ${item.product_id}`
      );
    }
  } catch (error) {
    console.error("Error releasing inventory:", error);
    throw error;
  }
}

async function initiateShippingProcess(invoiceNo: string) {
  try {
    const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

    if (!order) {
      return;
    }

    // Create shipping label or notify shipping department
    // Replace with your shipping service integration
    console.log(
      `🚚 Would initiate shipping for ${invoiceNo} to ${order.shipping_city}`
    );

    // Example: Update order with tracking number
    // const trackingNumber = await shippingService.createLabel(order);
    // await OrderService.updateOrder(order.order_id, {
    //   tracking_number: trackingNumber,
    //   order_status: 'processing'
    // });
  } catch (error) {
    console.error("Error initiating shipping:", error);
    throw error;
  }
}

const paymentController = new Elysia({
  prefix: "/payment",
  tags: ["credit_card"],
})

  .post(
    "/token",
    async ({ body, set }) => {
      try {
        const {
          invoiceNo,
          amount,
          currency = "THB",
          description,
          paymentChannel,
          paymentMethod,
          frontendReturnUrl,
          backendReturnUrl,
          request3DS = "",
          tokenize = false,
          orderData,
        } = body;

        // ✅ Basic validation
        if (!invoiceNo || amount === undefined || !description) {
          set.status = 400;
          return {
            error: true,
            message:
              "Missing required fields: invoiceNo, amount, or description",
          };
        }

        let orderId = null;
        let orderCreated = false;

        // ✅ Create order in DB and process everything if `orderData` is provided
        if (orderData) {
          try {
            console.log(`🛒 Creating complete order for invoice ${invoiceNo}`);

            // 🆕 Step 1: Validate stock availability BEFORE creating order
            if (orderData.items && orderData.items.length > 0) {
              console.log(
                `🔍 Validating stock for ${orderData.items.length} items`
              );
              for (const item of orderData.items) {
                const availableStock = await ProductService.getStockQuantity(
                  item.product_id
                );
                const productDetails = await ProductService.getProductDetails(
                  item.product_id
                );

                if (!productDetails) {
                  throw new Error(`Product not found: ${item.product_id}`);
                }
                if (!productDetails.is_active) {
                  throw new Error(
                    `Product is not active: ${productDetails.name} (${productDetails.sku})`
                  );
                }
                if (availableStock < item.quantity) {
                  throw new Error(
                    `Insufficient stock for ${productDetails.name}: Available ${availableStock}, Requested ${item.quantity}`
                  );
                }
              }
              console.log(`✅ Stock validation passed for all items`);
            }

            // 🆕 Step 2: Create order in database
            orderId = await OrderService.createOrderForPayment({
              invoice_no: invoiceNo,
              user_id: orderData.user_id,
              customer_name: orderData.customer_name,
              phone_number: orderData.phone_number,
              order_status: "pending" as OrderStatus,
              is_bulk_order: orderData.is_bulk_order || false,
              bulk_order_type: orderData.bulk_order_type || undefined,
              payment_method: paymentMethod || "credit_card",
              shipping_address_id: orderData.shipping_address_id || undefined,
              billing_address_id: orderData.billing_address_id || undefined,
              subtotal: orderData.subtotal || Number(amount),
              shipping_cost: orderData.shipping_cost || 0,
              tax_amount: orderData.tax_amount || 0,
              total_amount: Number(amount),
              notes:
                orderData.notes || `Payment via 2C2P - Invoice: ${invoiceNo}`,
            });

            console.log(`✅ Order created with ID: ${orderId}`);
            orderCreated = true;

            // 🆕 Step 3: Add order items
            if (orderData.items && orderData.items.length > 0) {
              console.log(`📝 Adding ${orderData.items.length} order items`);
              for (const item of orderData.items) {
                await OrderItemClass.createOrderItem({
                  order_id: orderId,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  subtotal: item.subtotal,
                });
              }
              console.log(`✅ All order items added successfully`);
            }

            // 🆕 Step 4: Create initial payment transaction log (pending status)
            await PaymentTransactionService.createPaymentLog({
              order_id: orderId,
              amount: Number(amount),
              payment_method: paymentMethod || "credit_card",
              transaction_status: "pending",
              transaction_reference: invoiceNo,
              payment_date: new Date(),
              notes: `2C2P Payment Initiated - Invoice: ${invoiceNo}`,
            });
            console.log(`✅ Initial payment transaction logged`);

            // 🆕 Step 5: Reserve stock quantities (reduce stock immediately)
            if (orderData.items && orderData.items.length > 0) {
              console.log(
                `📦 Reducing stock for ${orderData.items.length} products`
              );
              try {
                const stockUpdates =
                  await ProductService.reduceStockForMultipleProducts(
                    orderData.items.map((item: any) => ({
                      product_id: item.product_id,
                      quantity: item.quantity,
                    }))
                  );
                console.log(
                  `✅ Stock reduced successfully for ${stockUpdates.length} products:`
                );
                stockUpdates.forEach((update) => {
                  console.log(
                    `  - Product ${update.product_id}: ${update.previous_stock} → ${update.new_stock} (-${update.quantity_reduced})`
                  );
                });
              } catch (stockError) {
                console.error(`❌ Stock reduction failed:`, stockError);
                if (orderId) {
                  await OrderService.deleteOrder(orderId);
                  console.log(
                    `🔄 Order ${orderId} deleted due to stock reduction failure`
                  );
                }
                throw new Error(
                  `Stock reservation failed: ${
                    stockError instanceof Error
                      ? stockError.message
                      : "Unknown error"
                  }`
                );
              }
            }

            // 🆕 Step 7: Update order status
            await OrderService.updateOrderStatus(
              orderId,
              "pending" as OrderStatus
            );
            console.log(`✅ Order status updated to pending`);
          } catch (orderError: any) {
            console.error(`❌ Order creation/processing failed:`, orderError);
            if (orderCreated && orderId && orderData.items) {
              try {
                console.log(
                  `🔄 Attempting to restore stock due to order processing failure`
                );
                for (const item of orderData.items) {
                  await ProductService.restoreStockQuantity(
                    item.product_id,
                    item.quantity
                  );
                }
                console.log(`✅ Stock restored for failed order`);
              } catch (restoreError) {
                console.error(`❌ Failed to restore stock:`, restoreError);
              }
            }
            set.status = 500;
            return {
              error: true,
              message: "Failed to create and process order",
              details: orderError.message,
            };
          }
        }

        console.log(
          `💳 Generating 2C2P payment token for invoice ${invoiceNo}`
        );

        // ✅✅✅ นี่คือส่วนสำคัญที่แก้ไขให้ถูกต้อง 100% ✅✅✅
        const payload = {
          merchantID: process.env.MERCHANT_ID,
          invoiceNo,
          description,
          amount,
          currencyCode: currency,

          // แก้ไขค่าสำรองให้ชี้ไปที่ Backend API ที่ถูกต้อง
          frontendReturnUrl:
            frontendReturnUrl || // ใช้ค่าที่ Frontend ส่งมาเป็นอันดับแรก
            // `${process.env.API_BASE_URL}/payment/callback`, // ค่าสำรองที่ถูกต้อง
            `${process.env.BACKEND_RETURN_URL}/payment/callback`, // ค่าสำรองที่ถูกต้อง

          backendReturnUrl:
            backendReturnUrl ||
            // `${process.env.API_BASE_URL}/payment/webhook/backend`, // แก้ไขให้ใช้ตัวแปรเดียวกัน
            `${process.env.BACKEND_RETURN_URL}/payment/webhook/backend`, // แก้ไขให้ใช้ตัวแปรเดียวกัน
        } as any;

        if (paymentChannel && paymentChannel.length) {
          payload.paymentChannel = paymentChannel;
        }
        if (request3DS) {
          payload.request3DS = request3DS;
        }
        if (tokenize) {
          payload.tokenize = tokenize;
        }

        const jwtToken = createJWTPayload(payload);

        const { data } = await axios.post(
          `${getBaseUrl()}/payment/4.3/paymentToken`,
          { payload: jwtToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            timeout: 30000,
          }
        );

        console.log("2C2P Response Data:", data);

        const encodedPayload = data?.payload;
        if (!encodedPayload) {
          console.error(
            "❌ 2C2P did not return a valid payload. Raw response:",
            data
          );
          if (orderCreated && orderId && orderData?.items) {
            try {
              console.log(
                `🔄 2C2P failed, restoring stock for order ${orderId}`
              );
              for (const item of orderData.items) {
                await ProductService.restoreStockQuantity(
                  item.product_id,
                  item.quantity
                );
              }
              await OrderService.updateOrderStatus(
                orderId,
                "cancelled" as OrderStatus
              );
              console.log(`✅ Stock restored due to 2C2P failure`);
            } catch (restoreError) {
              console.error(
                `❌ Failed to restore stock after 2C2P failure:`,
                restoreError
              );
            }
          }
          set.status = 500;
          return {
            error: true,
            message: "2C2P API call failed or did not return a valid payload.",
            rawResponse: data,
          };
        }

        const decoded = decodeJWTPayload(encodedPayload) as any;

        console.log("DECODE: ", decoded);

        if (decoded.respCode !== "0000") {
          if (orderCreated && orderId && orderData?.items) {
            // ... Logic การคืนสต็อกกรณี 2C2P ตอบกลับเป็น Error ...
          }
          set.status = 400;
          return {
            error: true,
            respCode: decoded.respCode,
            message: decoded.respDesc,
          };
        }

        if (orderId) {
          try {
            await PaymentTransactionService.createPaymentLog({
              order_id: orderId,
              amount: Number(amount),
              payment_method: paymentMethod || "credit_card",
              transaction_status: "pending",
              transaction_reference: decoded.paymentToken,
              payment_date: new Date(),
              notes: `2C2P Payment Token Generated Successfully - Token: ${decoded.paymentToken}`,
            });
            console.log(`✅ Payment token logged successfully`);
          } catch (logError) {
            console.error(`⚠️ Failed to log payment token:`, logError);
          }
        }

        console.log(
          `🎉 Order processing completed successfully for invoice ${invoiceNo}`
        );

        return {
          paymentToken: decoded.paymentToken,
          webPaymentUrl: decoded.webPaymentUrl,
          redirectUrl: decoded.webPaymentUrl,
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
          orderId,
          orderStatus: orderCreated ? "pending" : null,
          stockReserved: orderCreated && (orderData?.items?.length ?? 0) > 0,
          itemsProcessed: orderData?.items?.length || 0,
        };
      } catch (error: any) {
        console.error(`❌ Token generation error:`, error);
        set.status = 500;
        return {
          error: true,
          message:
            error.response?.data?.message ||
            error.message ||
            "Internal server error",
          details: error.response?.data,
        };
      }
    },
    {
      body: t.Object({
        invoiceNo: t.String({ minLength: 1, maxLength: 50 }),
        amount: t.Union([t.String(), t.Number()]),
        currency: t.Optional(t.String({ default: "THB" })),
        description: t.String({ minLength: 1, maxLength: 250 }),
        paymentChannel: t.Optional(t.Array(t.String())),
        paymentMethod: t.Optional(t.String()),
        frontendReturnUrl: t.Optional(t.String()),
        backendReturnUrl: t.Optional(t.String()),
        request3DS: t.Optional(t.String()),
        tokenize: t.Optional(t.Boolean()),
        orderData: t.Optional(
          t.Object({
            user_id: t.Number(),
            is_bulk_order: t.Optional(t.Boolean()),
            bulk_order_type: t.Optional(t.String()),
            shipping_address_id: t.Optional(t.Number()),
            billing_address_id: t.Optional(t.Number()),
            subtotal: t.Optional(t.Number()),
            shipping_cost: t.Optional(t.Number()),
            tax_amount: t.Optional(t.Number()),
            notes: t.Optional(t.String()),
            customer_name: t.Optional(t.String()),
            phone_number: t.Optional(t.String()),
            items: t.Optional(
              t.Array(
                t.Object({
                  product_id: t.Number(),
                  quantity: t.Number(),
                  unit_price: t.Number(),
                  subtotal: t.Number(),
                })
              )
            ),
          })
        ),
      }),
    }
  )

  // === 🚀 3. UPDATED Endpoint: Backend Webhook (FINAL VERSION) ===
  .post("/webhook/backend", async ({ body, set }) => {
    try {
      console.log("🔔 Received backend webhook:", body);

      const { payload } = body as { payload: string };
      if (!payload) {
        set.status = 400;
        return { error: "Missing payload" };
      }

      // ⭐️ Webhook ใช้ JWT (ต่างจาก Callback ที่เป็น Base64) ⭐️
      const decoded = decodeJWTPayload(payload) as any;
      if (decoded.merchantID !== merchantId) {
        set.status = 400;
        return { error: "Invalid merchant ID" };
      }

      // ⭐️ เพิ่ม Logic การตรวจสอบ "RETRY_FOR" ⭐️
      let invoiceToUpdate = decoded.invoiceNo;
      if (invoiceToUpdate && invoiceToUpdate.includes("__RETRY__")) {
        invoiceToUpdate = invoiceToUpdate.split("__RETRY__")[0];
        console.log(
          `Webhook: mapping ${decoded.invoiceNo} back to ${invoiceToUpdate}`
        );
      }

      console.log("Payment webhook data:", {
        originalInvoiceNo: invoiceToUpdate,
        paymentAttemptInvoiceNo: decoded.invoiceNo,
      });

      const order = await OrderService.getOrderWithItemsByInvoice(
        invoiceToUpdate
      );
      if (!order) {
        console.error(`Order not found for invoice: ${invoiceToUpdate}`);
        return { success: true, error: "Order not found" };
      }

      // 🛡️ ป้องกันการทำงานซ้ำซ้อน
      if (
        order.payment_status === "completed" ||
        order.payment_status === "failed"
      ) {
        console.log(
          `🔁 Duplicate webhook for already processed invoice: ${invoiceToUpdate}. Skipping...`
        );
        return {
          success: true,
          message: "Duplicate webhook, already processed.",
        };
      }

      if (decoded.respCode === "0000" || decoded.respCode === "2000") {
        console.log(
          `✅ Webhook: RespCode ${decoded.respCode}. Treating as Success for ${invoiceToUpdate}.`
        );

        // --- Flow สำเร็จ ---
        const paymentDetails = {
          transaction_ref: decoded.tranRef,
          approval_code: decoded.approvalCode,
          payment_method: decoded.channelCode,
          amount_paid: parseFloat(decoded.amount),
          payment_date: new Date(decoded.transactionDateTime || new Date()),
          notes: `Payment successful (via Webhook). Code: ${decoded.respCode}`,
        };

        // 1. อัปเดต Payment Status -> completed
        await OrderService.updatePaymentStatus(
          invoiceToUpdate,
          "completed",
          paymentDetails
        );

        // 2. อัปเดต Order Status -> paid (ตาม ENUM ของคุณ)
        await OrderService.updateOrderStatusByInvoice(
          invoiceToUpdate,
          "paid" as OrderStatus,
          { notes: `Payment successful (Webhook ${decoded.respCode}).` }
        );

        // 3. เรียกฟังก์ชันผู้ช่วย (ตัดสต็อก, ส่งอีเมล)
        await processSuccessfulPayment(invoiceToUpdate, paymentDetails);
      } else {
        // --- Flow ล้มเหลว (RespCode อื่นๆ ทั้งหมด) ---
        console.log(
          `❌ Webhook: RespCode ${decoded.respCode}. Treating as Failure for ${invoiceToUpdate}.`
        );

        const failureDetails = {
          transaction_ref: decoded.tranRef,
          payment_method: decoded.channelCode,
          amount: decoded.amount,
          notes: `Payment failed (Webhook): ${decoded.respDesc}`,
          payment_date: new Date(decoded.transactionDateTime || new Date()),
        };

        // 1. อัปเดต Payment Status -> failed
        await OrderService.updatePaymentStatus(
          invoiceToUpdate,
          "failed",
          failureDetails
        );

        // 2. อัปเดต Order Status -> cancelled (ตาม ENUM ของคุณ)
        await OrderService.updateOrderStatusByInvoice(
          invoiceToUpdate,
          "cancelled" as OrderStatus,
          { notes: decoded.respDesc }
        );

        // 3. เรียกฟังก์ชันผู้ช่วย (คืนสต็อก)
        await processFailedPayment(invoiceToUpdate, failureDetails);
      }

      return { success: true, message: "Webhook processed" };
    } catch (error: any) {
      console.error("Backend webhook error:", error);
      return { success: true, error: "Webhook processing failed" };
    }
  })

  // === 4. Frontend Return URL Handler ===
  .post(
    "/webhook/frontend",
    async ({ body, set }) => {
      try {
        console.log("🌐 Received frontend webhook:", body);

        const { payload } = body;
        if (!payload) {
          set.status = 400;
          return { error: "Missing payload" };
        }

        const decoded = decodeJWTPayload(payload) as any;

        return {
          invoiceNo: decoded.invoiceNo,
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
          success: decoded.respCode === "0000",
          channelCode: decoded.channelCode,
        };
      } catch (error: any) {
        console.error("Frontend webhook error:", error);
        set.status = 500;
        return {
          error: true,
          message: "Webhook processing failed",
        };
      }
    },
    {
      body: t.Object({
        payload: t.String(),
      }),
    }
  )

  // === 2. Payment Inquiry API ===
  .post(
    "/inquiry",
    async ({ body, set }) => {
      try {
        const { invoiceNo, paymentToken } = body;

        if (!invoiceNo && !paymentToken) {
          set.status = 400;
          return {
            error: true,
            message: "Either invoiceNo or paymentToken is required",
          };
        }

        const payload: any = {
          merchantID: merchantId,
        };

        if (invoiceNo) payload.invoiceNo = invoiceNo;
        if (paymentToken) payload.paymentToken = paymentToken;

        const jwtToken = createJWTPayload(payload);

        const response = await axios.post(
          `${getBaseUrl()}/payment/4.3/paymentInquiry`,
          { payload: jwtToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            timeout: 30000,
          }
        );

        const encodedPayload = response.data?.payload;
        if (!encodedPayload) {
          set.status = 500;
          return {
            error: true,
            message: "2C2P did not return a valid payload",
          };
        }

        const decoded = decodeJWTPayload(encodedPayload) as any;

        return {
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
          data: decoded,
        };
      } catch (error: any) {
        console.error("Payment inquiry error:", error);
        set.status = 500;
        return {
          error: true,
          message:
            error.response?.data?.message ||
            error.message ||
            "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        invoiceNo: t.Optional(t.String()),
        paymentToken: t.Optional(t.String()),
      }),
    }
  )

  // === 5. Enhanced Payment Status Check ===
  .get(
    "/status/:invoiceNo",
    async ({ params, set }) => {
      try {
        const { invoiceNo } = params;

        console.log(`🔍 Checking payment status for ${invoiceNo}`);

        // Try 2C2P payment inquiry first
        const payload = {
          merchantID: merchantId,
          invoiceNo,
        };

        const jwtToken = createJWTPayload(payload);

        const response = await axios.post(
          `${getBaseUrl()}/payment/4.3/paymentInquiry`,
          { payload: jwtToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            timeout: 30000,
          }
        );

        const encodedPayload = response.data?.payload;
        if (!encodedPayload) {
          set.status = 500;
          return {
            error: true,
            message: "2C2P did not return a valid payload",
          };
        }

        const decoded = decodeJWTPayload(encodedPayload) as any;

        // Map 2C2P response codes to status
        let status = "unknown";
        if (decoded.respCode === "0000") {
          status = "completed";
        } else if (decoded.respCode === "2000") {
          status = "pending";
        } else if (
          decoded.respCode?.startsWith("4") ||
          decoded.respCode?.startsWith("5")
        ) {
          status = "failed";
        } else {
          status = "pending";
        }

        return {
          invoiceNo,
          status,
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
          paymentDetails: {
            amount: decoded.amount,
            currency: decoded.currencyCode,
            tranRef: decoded.tranRef,
            approvalCode: decoded.approvalCode,
            transactionDateTime: decoded.transactionDateTime,
            channelCode: decoded.channelCode,
          },
        };
      } catch (error: any) {
        console.error("Payment status check error:", error);
        set.status = 500;
        return {
          error: true,
          message:
            error.response?.data?.message ||
            error.message ||
            "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
    }
  )

  // === 6. Get Order by Invoice Number ===
  .get(
    "/order/:invoiceNo",
    async ({ params, set }) => {
      try {
        const { invoiceNo } = params;

        console.log(`🔍 Looking for order with invoice: ${invoiceNo}`);

        // Use OrderService to get order by invoice
        const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

        if (!order) {
          set.status = 404;
          return {
            error: true,
            message: "Order not found",
          };
        }

        return {
          success: true,
          order: order,
        };
      } catch (error: any) {
        console.error("Error fetching order by invoice:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to fetch order",
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
    }
  )

  // === 7. Manual Order Status Update API ===
  // .patch(
  //   "/order/:invoiceNo/status",
  //   async ({ params, body, set }) => {
  //     try {
  //       const { invoiceNo } = params;
  //       const { order_status, payment_details } = body;

  //       // Validate order status
  //       const validOrderStatuses: OrderStatus[] = [
  //         "pending",
  //         "confirmed",
  //         "processing",
  //         "shipped",
  //         "delivered",
  //         "cancelled",
  //         "failed",
  //       ];
  //       if (!validOrderStatuses.includes(order_status)) {
  //         set.status = 400;
  //         return {
  //           error: true,
  //           message: "Invalid order status",
  //         };
  //       }

  //       const updated = await OrderService.updateOrderStatusByInvoice(
  //         invoiceNo,
  //         order_status,
  //         payment_details
  //       );

  //       if (!updated) {
  //         set.status = 404;
  //         return {
  //           error: true,
  //           message: "Order not found",
  //         };
  //       }

  //       return {
  //         success: true,
  //         message: "Order status updated",
  //         invoiceNo,
  //         order_status,
  //       };
  //     } catch (error: any) {
  //       console.error("Error updating order status:", error);
  //       set.status = 500;
  //       return {
  //         error: true,
  //         message: error.message || "Failed to update order status",
  //       };
  //     }
  //   },
  //   {
  //     params: t.Object({
  //       invoiceNo: t.String(),
  //     }),
  //     body: t.Object({
  //       order_status: t.Union([
  //         t.Literal("pending"),
  //         t.Literal("confirmed"),
  //         t.Literal("processing"),
  //         t.Literal("shipped"),
  //         t.Literal("delivered"),
  //         t.Literal("cancelled"),
  //         t.Literal("failed"),
  //       ]),
  //       payment_details: t.Optional(
  //         t.Object({
  //           tracking_number: t.Optional(t.String()),
  //           notes: t.Optional(t.String()),
  //         })
  //       ),
  //     }),
  //   }
  // )

  .patch(
    "/order/status/:invoiceNo", // ⭐ path ใหม่
    async ({ params, body, set }) => {
      console.log("🎯 === CORRECT ENDPOINT HIT ===");
      console.log("📥 Invoice:", params.invoiceNo);
      console.log("📥 Body:", body);

      try {
        const { invoiceNo } = params;
        const { order_status, payment_details } = body;

        console.log(
          `🔄 Updating order ${invoiceNo} to status: ${order_status}`
        );

        // Validate order status
        const validOrderStatuses: OrderStatus[] = [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "failed",
        ];

        if (!validOrderStatuses.includes(order_status)) {
          set.status = 400;
          return { error: true, message: "Invalid order status" };
        }

        // ดึงข้อมูลออเดอร์
        console.log(`🔍 Fetching order...`);
        const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

        if (!order) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        console.log(`✅ Order found with ${order.items?.length || 0} items`);

        // คืนสต็อกถ้ายกเลิก
        if (
          order_status === "cancelled" &&
          order.items &&
          order.items.length > 0
        ) {
          console.log(`🔄 Cancelling order - restoring stock...`);

          for (const item of order.items) {
            console.log(
              `  → Restoring ${item.quantity}x of product ${item.product_id}`
            );
            try {
              await ProductService.restoreStockQuantity(
                item.product_id,
                item.quantity
              );
              console.log(`  ✅ Stock restored for product ${item.product_id}`);
            } catch (error) {
              console.error(`  ❌ Failed to restore stock:`, error);
              set.status = 500;
              return {
                error: true,
                message: `Failed to restore stock for product ${item.product_id}`,
              };
            }
          }

          console.log(`✅ All stock restored successfully!`);
        }

        // อัปเดตสถานะ
        console.log(`📝 Updating order status...`);
        const updated = await OrderService.updateOrderStatusByInvoice(
          invoiceNo,
          order_status,
          payment_details
        );

        if (!updated) {
          set.status = 500;
          return {
            error: true,
            message: "Failed to update order status",
          };
        }

        console.log(`✅ Order status updated successfully!`);

        return {
          success: true,
          message: "Order status updated successfully",
          invoiceNo,
          order_status,
          ...(order_status === "cancelled" && {
            stockRestored: order.items?.length || 0,
          }),
        };
      } catch (error: any) {
        console.error("💥 Error:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to update order status",
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
      body: t.Object({
        order_status: t.Union([
          t.Literal("pending"),
          t.Literal("confirmed"),
          t.Literal("processing"),
          t.Literal("shipped"),
          t.Literal("delivered"),
          t.Literal("cancelled"),
          t.Literal("failed"),
        ]),
        payment_details: t.Optional(
          t.Object({
            tracking_number: t.Optional(t.String()),
            notes: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // === 8. Get Orders by Status ===
  .get(
    "/orders/status/:status",
    async ({ params, query }) => {
      try {
        const { status } = params;
        const { limit = 50, offset = 0 } = query;

        // Validate status
        const validOrderStatuses: OrderStatus[] = [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "failed",
        ];
        if (!validOrderStatuses.includes(status as OrderStatus)) {
          return {
            error: true,
            message: "Invalid order status",
          };
        }

        const orders = await OrderService.getOrdersByPaymentStatus(
          status as OrderStatus,
          Number(limit),
          Number(offset)
        );

        return {
          success: true,
          orders,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            count: Array.isArray(orders) ? orders.length : 0,
          },
        };
      } catch (error: any) {
        console.error("Error fetching orders by status:", error);
        return {
          error: true,
          message: error.message || "Failed to fetch orders",
        };
      }
    },
    {
      params: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("confirmed"),
          t.Literal("processing"),
          t.Literal("shipped"),
          t.Literal("delivered"),
          t.Literal("cancelled"),
          t.Literal("failed"),
        ]),
      }),
      query: t.Object({
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
    }
  )

  // === 9. Payment Options API ===
  .post(
    "/options",
    async ({ body, set }) => {
      try {
        const { paymentToken, locale = "en" } = body;

        if (!paymentToken) {
          set.status = 400;
          return {
            error: true,
            message: "paymentToken is required",
          };
        }

        const payload = {
          paymentToken,
          locale,
        };

        const jwtToken = createJWTPayload(payload);

        const response = await axios.post(
          `${getBaseUrl()}/payment/4.3/paymentOption`,
          { payload: jwtToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            timeout: 30000,
          }
        );

        const encodedPayload = response.data?.payload;
        if (!encodedPayload) {
          set.status = 500;
          return {
            error: true,
            message: "2C2P did not return a valid payload",
          };
        }

        const decoded = decodeJWTPayload(encodedPayload) as any;

        return decoded;
      } catch (error: any) {
        console.error("Payment options error:", error);
        set.status = 500;
        return {
          error: true,
          message:
            error.response?.data?.message ||
            error.message ||
            "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        paymentToken: t.String(),
        locale: t.Optional(t.String({ default: "en" })),
      }),
    }
  )

  // === 10. Utility endpoint to generate payment URL ===
  .get(
    "/url/:paymentToken",
    async ({ params }) => {
      const { paymentToken } = params;

      const baseUIUrl =
        environment === "production"
          ? "https://pgw-ui.2c2p.com"
          : "https://sandbox-pgw-ui.2c2p.com";

      return {
        paymentUrl: `${baseUIUrl}/payment/4.3/#/token/${encodeURIComponent(
          paymentToken
        )}`,
        qrCodeUrl: `${getBaseUrl()}/payment/4.3/qrcode/${encodeURIComponent(
          paymentToken
        )}`,
        environment,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes from now
      };
    },
    {
      params: t.Object({
        paymentToken: t.String(),
      }),
    }
  )

  .post(
    "/retry",
    async ({ body, set }) => {
      try {
        const { invoiceNo } = body;
        if (!invoiceNo) {
          set.status = 400;
          return { error: true, message: "Invoice number is required" };
        }

        console.log(`🔄 === RETRY PAYMENT REQUEST ===`);
        console.log(`📝 Original Invoice: ${invoiceNo}`);

        // 1. ดึงออเดอร์เดิม
        const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);
        if (!order) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        // 2. ตรวจสอบสถานะ
        if (order.order_status !== "pending") {
          set.status = 400;
          return {
            error: true,
            message: `Cannot retry payment. Order status is: ${order.order_status}`,
          };
        }

        // 3. ตรวจสอบสต็อก
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            const availableStock = await ProductService.getStockQuantity(
              item.product_id
            );
            if (availableStock < item.quantity) {
              throw new Error(
                `Insufficient stock for product: ${item.product_id}`
              );
            }
          }
        }

        // 4. Format Amount
        const formattedAmount = parseFloat(
          parseFloat(order.total_amount).toFixed(2)
        );

        // 5. สร้าง Invoice No ใหม่ (สำหรับ 2C2P) โดย "ฝัง" Invoice เก่าไว้
        const newPaymentAttemptInvoiceNo = `${invoiceNo}__RETRY__${Date.now()
          .toString()
          .slice(-6)}`;
        console.log(`🆕 New Payment Invoice: ${newPaymentAttemptInvoiceNo}`);

        const API_BASE_URL =
          process.env.BACKEND_RETURN_URL || "http://localhost:8080/api";
        console.log(`🌐 Using Base Callback URL: ${API_BASE_URL}`);

        const payload = {
          merchantID: process.env.MERCHANT_ID,
          invoiceNo: newPaymentAttemptInvoiceNo,
          description: `Retry for ${invoiceNo}`, // description นี้ 2C2P อาจไม่ส่งกลับมา
          amount: formattedAmount,
          currencyCode: "THB",
          frontendReturnUrl: `${API_BASE_URL}/payment/callback`,
          backendReturnUrl: `${API_BASE_URL}/payment/webhook/backend`,
        } as any;

        console.log(`📦 2C2P Payload:`, JSON.stringify(payload, null, 2));

        const jwtToken = createJWTPayload(payload);

        // 6. ยิง API ไป 2C2P
        const { data } = await axios.post(
          `${getBaseUrl()}/payment/4.3/paymentToken`,
          { payload: jwtToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            timeout: 30000,
          }
        );

        console.log(`📨 2C2P Response:`, JSON.stringify(data, null, 2));

        if (!data.payload) {
          console.error("❌ 2C2P did not return payload");
          throw new Error(
            `2C2P Error: ${data.respDesc || "No payload returned"}`
          );
        }

        const decoded = decodeJWTPayload(data.payload) as any;

        if (decoded.respCode !== "0000") {
          throw new Error(`2C2P Error: ${decoded.respDesc}`);
        }

        console.log(`✅ Payment token generated successfully`);
        console.log(`🔗 Payment URL: ${decoded.webPaymentUrl}`);

        // 7. ส่ง URL กลับไป
        return {
          success: true,
          paymentToken: decoded.paymentToken,
          webPaymentUrl: decoded.webPaymentUrl,
        };
      } catch (error: any) {
        console.error(`❌ Retry payment error:`, error.message);
        console.error(`Stack:`, error.stack);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        invoiceNo: t.String(),
      }),
    }
  )

  .post(
    "/callback",
    async ({ body, set, query }) => {
      try {
        console.log("🔄 POST Payment callback received. Body:", body);

        // 1. ดึง Base64 payload จาก 'paymentResponse'
        const payloadBase64 = (body as any)?.paymentResponse;

        if (!payloadBase64) {
          throw new Error("Missing 'paymentResponse' data in callback body");
        }

        // 2. "แกะกล่อง" (Base64 Decode)
        const decodedJsonString = Buffer.from(payloadBase64, "base64").toString(
          "utf8"
        );
        const decoded = JSON.parse(decodedJsonString);

        // 3. "ค้นหา" Invoice เก่าจาก Invoice ใหม่
        let invoiceToUpdate = decoded.invoiceNo; // (เช่น INV-123__RETRY__456)
        let paymentAttemptInvoiceNo = decoded.invoiceNo; // ⭐️ เก็บตัวใหม่ไว้ใช้ Inquiry

        if (invoiceToUpdate && invoiceToUpdate.includes("__RETRY__")) {
          invoiceToUpdate = invoiceToUpdate.split("__RETRY__")[0]; // (ได้ INV-123)
          console.log(
            `Callback: mapping ${decoded.invoiceNo} back to ${invoiceToUpdate}`
          );
        }

        if (!invoiceToUpdate) {
          throw new Error("Could not determine invoice number to update");
        }

        console.log("💳 Callback decoded data:", {
          originalInvoiceNo: invoiceToUpdate,
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
        });

        const order = await OrderService.getOrderWithItemsByInvoice(
          invoiceToUpdate
        );
        if (!order) {
          const errorUrl = `${process.env.FRONT_RETURN_URL}/payment/notsuccess?message=OrderNotFound`;
          set.status = 302;
          set.headers.location = errorUrl;
          return;
        }

        // 4. ป้องกันการทำงานซ้ำ
        if (
          order.payment_status === "completed" ||
          order.payment_status === "failed"
        ) {
          console.log(
            `🔁 Duplicate callback for already processed invoice: ${invoiceToUpdate}. Skipping...`
          );
          const redirectUrl = `${
            process.env.FRONT_RETURN_URL
          }/payment/success?invoiceNo=${invoiceToUpdate}&status=${
            order.payment_status === "completed" ? "0000" : "failed"
          }`;
          set.status = 302;
          set.headers.location = redirectUrl;
          return;
        }

        // 5. ประมวลผลและตัดสินใจ
        let redirectUrl = "";
        let finalRespCode = decoded.respCode; // ⭐️ ใช้ respCode ที่ได้รับมาเป็นค่าเริ่มต้น

        // ⭐️⭐️⭐️ START: Logic การตัดสินใจใหม่ ⭐️⭐️⭐️

        // ถ้า respCode ไม่ใช่ "0000" (สำเร็จทันที)
        if (decoded.respCode !== "0000") {
          console.log(
            `⚠️ Ambiguous RespCode ${decoded.respCode}. Performing Payment Inquiry...`
          );

          // "โทรกลับไปถาม" 2C2P เพื่อเอาสถานะจริง
          try {
            const inquiryPayload = {
              merchantID: process.env.MERCHANT_ID,
              invoiceNo: paymentAttemptInvoiceNo, // ⭐️ ใช้ Invoice ใหม่ (ตัวที่จ่ายเงิน)
            };
            const jwtToken = createJWTPayload(inquiryPayload);

            const inquiryResponse = await axios.post(
              `${getBaseUrl()}/payment/4.3/paymentInquiry`,
              { payload: jwtToken },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "text/plain",
                },
              }
            );

            if (!inquiryResponse.data.payload) {
              throw new Error("Inquiry failed: No payload returned from 2C2P.");
            }

            const inquiryDecoded = decodeJWTPayload(
              inquiryResponse.data.payload
            ) as any;
            console.log(`✅ Inquiry Response:`, inquiryDecoded);

            finalRespCode = inquiryDecoded.respCode; // ⭐️ อัปเดต respCode เป็น "ค่าจริง"
          } catch (inquiryError: any) {
            console.error("❌ Payment Inquiry failed:", inquiryError.message);
            // ถ้า "โทรไปถาม" ก็ยังพังอีก ให้ถือว่า "ล้มเหลว" ไปเลย
            finalRespCode = "9999"; // (รหัส Error สมมติ)
          }
        }

        // ⭐️⭐️⭐️ END: Logic การตัดสินใจใหม่ ⭐️⭐️⭐️

        // 6. ประมวลผลตาม "สถานะจริง" (finalRespCode)
        try {
          const paymentDetails = {
            transaction_ref: decoded.tranRef || decoded.invoiceNo,
            approval_code: decoded.approvalCode || null,
            payment_method: decoded.channelCode,
            amount_paid: parseFloat(decoded.amount || order.total_amount),
            payment_date: new Date(decoded.transactionDateTime || new Date()),
            notes: `Payment status from 2C2P: ${decoded.respDesc} (Final Code: ${finalRespCode})`,
          };

          if (finalRespCode === "0000") {
            // --- Flow สำเร็จ ---
            await OrderService.updatePaymentStatus(
              invoiceToUpdate,
              "completed",
              paymentDetails
            );
            await OrderService.updateOrderStatusByInvoice(
              invoiceToUpdate,
              "paid" as OrderStatus,
              { notes: "Payment successful (0000)." }
            );
            await processSuccessfulPayment(invoiceToUpdate, paymentDetails);

            redirectUrl = `${process.env.FRONT_RETURN_URL}/payment/success?invoiceNo=${invoiceToUpdate}&status=0000`;
          } else {
            // --- Flow ล้มเหลว/ยกเลิก (เช่น 2000, 9015, 9999) ---
            await OrderService.updatePaymentStatus(
              invoiceToUpdate,
              "failed",
              paymentDetails
            );
            await OrderService.updateOrderStatusByInvoice(
              invoiceToUpdate,
              "cancelled" as OrderStatus,
              { notes: decoded.respDesc }
            );
            await processFailedPayment(invoiceToUpdate, paymentDetails); // คืนสต็อก

            redirectUrl = `${
              process.env.FRONT_RETURN_URL
            }/payment/notsuccess?invoiceNo=${invoiceToUpdate}&status=${finalRespCode}&message=${encodeURIComponent(
              decoded.respDesc
            )}`;
          }
        } catch (dbError: any) {
          console.error(
            `🔥 DATABASE ERROR while processing invoice ${invoiceToUpdate}:`,
            dbError
          );
          const errorUrl = `${
            process.env.FRONT_RETURN_URL
          }/payment/notsuccess?message=DatabaseProcessingError&details=${encodeURIComponent(
            dbError.message
          )}`;
          set.status = 302;
          set.headers.location = errorUrl;
          return;
        }

        // 7. Redirect ครั้งสุดท้าย
        console.log(`🚀 Redirecting user directly to: ${redirectUrl}`);
        set.status = 302;
        set.headers.location = redirectUrl;
        return;
      } catch (error: any) {
        console.error("❌ Fatal callback processing error:", error.message);
        const errorUrl = `${
          process.env.FRONT_RETURN_URL
        }/payment/notsuccess?message=${encodeURIComponent(error.message)}`;
        set.status = 302;
        set.headers.location = errorUrl;
        return;
      }
    },
    {
      // ⭐️ Validation ที่ยืดหยุ่น ⭐️
      query: t.Object({
        test: t.Optional(t.String()),
        invoiceNo: t.Optional(t.String()),
        payload: t.Optional(t.String()),
      }),
      body: t.Optional(t.Any()),
    }
  )

  .get(
    "/callback",
    async ({ query, set, request }) => {
      try {
        console.log("🔔 === 2C2P GET CALLBACK RECEIVED ===");
        console.log("🔗 Query:", JSON.stringify(query, null, 2));
        console.log("📋 Headers:", JSON.stringify(request.headers, null, 2));
        console.log("🔗 Full URL:", request.url);
        console.log("===============================");

        let payload = query.payload;

        // ⭐️ Test Mode (สำหรับ Dev)
        if (query.test === "success") {
          console.warn(
            "⚠️ RUNNING IN TEST MODE: Simulating successful payment"
          );
          const testPayload = {
            merchantID: process.env.MERCHANT_ID,
            invoiceNo: query.invoiceNo || `SIM-${Date.now()}`,
            respCode: "0000",
            respDesc: "Success (Simulated via Test Mode)",
            tranRef: "SIM_TRAN_REF_123",
            approvalCode: "SIM_APPROVE_456",
            channelCode: "SIM_CC",
            amount: "1.00",
            transactionDateTime: new Date().toISOString(),
          };
          payload = jwt.sign(testPayload, process.env.SECRET_KEY_2!, {
            algorithm: "HS256",
          });
          console.log(
            `✅ Simulated payload created for invoice: ${testPayload.invoiceNo}`
          );
        }

        // 🚨 ตรวจสอบว่ามี payload หรือไม่
        if (!payload) {
          console.error("❌ CRITICAL: No payload in GET callback");
          console.error("Available query params:", Object.keys(query));

          const errorUrl = `${
            process.env.FRONT_RETURN_URL
          }/payment/notsuccess?message=No_Payload_GET&timestamp=${Date.now()}`;
          set.status = 302;
          set.headers.location = errorUrl;
          return;
        }

        // Decode JWT
        let decoded;
        try {
          decoded = decodeJWTPayload(payload as string) as any;
          console.log("🔓 Decoded Payload:", JSON.stringify(decoded, null, 2));
        } catch (jwtError) {
          console.error("❌ Invalid JWT in GET callback:", jwtError);
          const errorUrl = `${process.env.FRONT_RETURN_URL}/payment/notsuccess?message=Invalid_JWT`;
          set.status = 302;
          set.headers.location = errorUrl;
          return;
        }

        // ตรวจสอบ Merchant ID
        if (decoded.merchantID !== merchantId) {
          console.error(`❌ Invalid merchant ID: ${decoded.merchantID}`);
          throw new Error(`Invalid merchant ID: ${decoded.merchantID}`);
        }

        // ⭐️ รองรับ RETRY_FOR
        let invoiceToUpdate = decoded.invoiceNo;
        if (
          decoded.description &&
          decoded.description.startsWith("RETRY_FOR:")
        ) {
          invoiceToUpdate = decoded.description.split(":")[1];
          console.log(
            `🔄 Retry payment detected. Mapping ${decoded.invoiceNo} → ${invoiceToUpdate}`
          );
        }

        if (!invoiceToUpdate) {
          throw new Error("Could not determine invoice number");
        }

        console.log("💳 GET Callback - Processing invoice:", invoiceToUpdate);
        console.log("📊 Payment Status:", {
          respCode: decoded.respCode,
          respDesc: decoded.respDesc,
          tranRef: decoded.tranRef,
          approvalCode: decoded.approvalCode,
        });

        // ดึงข้อมูลออเดอร์
        const order = await OrderService.getOrderWithItemsByInvoice(
          invoiceToUpdate
        );

        if (!order && query.test !== "success") {
          console.error(`❌ Order not found for invoice: ${invoiceToUpdate}`);
          const errorUrl = `${process.env.FRONT_RETURN_URL}/payment/notsuccess?message=OrderNotFound&invoice=${invoiceToUpdate}`;
          set.status = 302;
          set.headers.location = errorUrl;
          return;
        }

        // 🛡️ ป้องกันการทำซ้ำ (Idempotency Check)
        if (
          order &&
          (order.payment_status === "completed" ||
            order.payment_status === "failed")
        ) {
          console.log(
            `🔁 Duplicate GET callback for already processed invoice: ${invoiceToUpdate}`
          );
          console.log(`Current status: ${order.payment_status}`);

          const redirectUrl = `${
            process.env.FRONT_RETURN_URL
          }/payment/success?invoiceNo=${invoiceToUpdate}&status=${
            order.payment_status === "completed" ? "0000" : "failed"
          }&duplicate=true`;
          set.status = 302;
          set.headers.location = redirectUrl;
          return;
        }

        // 💰 ประมวลผลการชำระเงิน (ถ้ายังไม่ได้ประมวลผล)
        if (order) {
          try {
            const paymentDetails = {
              transaction_ref: decoded.tranRef,
              approval_code: decoded.approvalCode,
              payment_method: decoded.channelCode,
              amount_paid: parseFloat(decoded.amount),
              payment_date: new Date(decoded.transactionDateTime || new Date()),
              notes: `Payment via 2C2P (GET Callback): ${decoded.respDesc} (Code: ${decoded.respCode})`,
            };

            if (decoded.respCode === "0000") {
              // ✅ ชำระเงินสำเร็จ
              console.log(
                `✅ Payment successful for ${invoiceToUpdate} (via GET callback)`
              );

              // 1️⃣ อัปเดต Payment Status → completed
              await OrderService.updatePaymentStatus(
                invoiceToUpdate,
                "completed",
                paymentDetails
              );
              console.log(`✅ Payment status updated to: completed`);

              // 2️⃣ อัปเดต Order Status → paid
              await OrderService.updateOrderStatusByInvoice(
                invoiceToUpdate,
                "paid" as OrderStatus,
                { notes: "Payment completed via GET callback" }
              );
              console.log(`✅ Order status updated to: paid`);

              // 3️⃣ ส่งอีเมลยืนยัน + ลด Stock (ถ้ายังไม่ได้ลด)
              try {
                await processSuccessfulPayment(invoiceToUpdate, paymentDetails);
                console.log(`✅ Post-payment processing completed`);
              } catch (processError) {
                console.error(
                  `⚠️ Post-payment processing error:`,
                  processError
                );
                // ไม่ fail ทั้ง request ถ้า email/stock ล้มเหลว
              }
            } else {
              // ❌ ชำระเงินล้มเหลว
              console.log(
                `❌ Payment failed for ${invoiceToUpdate}: ${decoded.respDesc}`
              );

              // 1️⃣ อัปเดต Payment Status → failed
              await OrderService.updatePaymentStatus(
                invoiceToUpdate,
                "failed",
                paymentDetails
              );

              // 2️⃣ อัปเดต Order Status → failed
              await OrderService.updateOrderStatusByInvoice(
                invoiceToUpdate,
                "failed" as OrderStatus,
                { notes: decoded.respDesc }
              );

              // 3️⃣ ส่งอีเมลแจ้งความล้มเหลว
              try {
                await processFailedPayment(invoiceToUpdate, paymentDetails);
              } catch (processError) {
                console.error(
                  `⚠️ Failed payment processing error:`,
                  processError
                );
              }
            }

            console.log(
              `✅ Payment processing completed for ${invoiceToUpdate}`
            );
          } catch (dbError) {
            console.error(
              `🔥 DATABASE ERROR while processing ${invoiceToUpdate}:`,
              dbError
            );
            console.error("Stack:", (dbError as Error).stack);

            const errorUrl = `${process.env.FRONT_RETURN_URL}/payment/notsuccess?message=DatabaseError&invoice=${invoiceToUpdate}`;
            set.status = 302;
            set.headers.location = errorUrl;
            return;
          }
        }

        // ✅ Redirect ไปหน้าสำเร็จ/ล้มเหลว
        const finalStatus =
          decoded.respCode === "0000" ? "success" : "notsuccess";
        const redirectUrl = `${
          process.env.FRONT_RETURN_URL
        }/payment/${finalStatus}?invoiceNo=${invoiceToUpdate}&status=${
          decoded.respCode
        }&message=${encodeURIComponent(decoded.respDesc)}&source=get`;

        console.log(`🚀 Redirecting to: ${redirectUrl}`);
        console.log("=== END GET CALLBACK ===\n");

        set.status = 302;
        set.headers.location = redirectUrl;
        return;
      } catch (error: any) {
        console.error("❌ FATAL GET CALLBACK ERROR:", error.message);
        console.error("Stack:", error.stack);

        const errorUrl = `${
          process.env.FRONT_RETURN_URL
        }/payment/notsuccess?message=${encodeURIComponent(
          error.message
        )}&source=get`;
        set.status = 302;
        set.headers.location = errorUrl;
        return;
      }
    },
    {
      query: t.Object({
        payload: t.Optional(t.String()),
        test: t.Optional(t.String()),
        invoiceNo: t.Optional(t.String()),
      }),
    }
  )

  // === 12. Frontend Payment Result API ===
  .get(
    "/result/:invoiceNo",
    async ({ params, set }) => {
      try {
        const { invoiceNo } = params;

        console.log(`🔍 Getting payment result for ${invoiceNo}`);

        // Get order details from database
        const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);

        if (!order) {
          set.status = 404;
          return {
            error: true,
            message: "Order not found",
            invoiceNo,
          };
        }

        // Get payment transaction history
        let paymentTransactions: any[] = [];
        try {
          paymentTransactions =
            await PaymentTransactionService.getPaymentTransactionsByOrderId(
              order.order_id
            );
        } catch (txError) {
          console.warn("⚠️ Could not fetch payment transactions:", txError);
        }

        // Also get latest payment status from 2C2P
        let paymentStatus = null;
        try {
          const payload = {
            merchantID: merchantId,
            invoiceNo,
          };

          const jwtToken = createJWTPayload(payload);

          const response = await axios.post(
            `${getBaseUrl()}/payment/4.3/paymentInquiry`,
            { payload: jwtToken },
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "text/plain",
              },
              timeout: 10000,
            }
          );

          const encodedPayload = response.data?.payload;
          if (encodedPayload) {
            const decoded = decodeJWTPayload(encodedPayload) as any;
            paymentStatus = {
              respCode: decoded.respCode,
              respDesc: decoded.respDesc,
              tranRef: decoded.tranRef,
              approvalCode: decoded.approvalCode,
              transactionDateTime: decoded.transactionDateTime,
              channelCode: decoded.channelCode,
            };
          }
        } catch (inquiryError) {
          console.warn("⚠️ Payment inquiry failed:", inquiryError);
          // Continue without 2C2P status if inquiry fails
        }

        return {
          success: true,
          invoiceNo: order.invoice_no,
          order: {
            id: order.order_id,
            status: order.order_status,
            paymentStatus: order.payment_status,
            totalAmount: order.total_amount,
            customerName: `${order.customer_first_name || ""} ${
              order.customer_last_name || ""
            }`.trim(),
            customerEmail: order.customer_email,
            createdAt: order.created_at,
            items: order.items,
          },
          paymentDetails: {
            transactionRef: order.transaction_ref,
            approvalCode: order.approval_code,
            paymentMethod: order.payment_method,
            amountPaid: order.amount_paid,
            paymentDate: order.payment_date,
          },
          paymentTransactions,
          latestPaymentStatus: paymentStatus,
        };
      } catch (error: any) {
        console.error("❌ Error getting payment result:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to get payment result",
          invoiceNo: params.invoiceNo,
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
    }
  )

  // === 13. 🆕 New Endpoint: Get Payment Transactions by Order ===
  .get(
    "/transactions/:invoiceNo",
    async ({ params, set }) => {
      try {
        const { invoiceNo } = params;

        // Get order first
        const order = await OrderService.getOrderWithItemsByInvoice(invoiceNo);
        if (!order) {
          set.status = 404;
          return {
            error: true,
            message: "Order not found",
          };
        }

        // Get payment transactions
        const transactions =
          await PaymentTransactionService.getPaymentTransactionsByOrderId(
            order.order_id
          );

        return {
          success: true,
          invoiceNo,
          orderId: order.order_id,
          transactions,
        };
      } catch (error: any) {
        console.error("❌ Error fetching payment transactions:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to fetch payment transactions",
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
    }
  )

  // === 14. 🆕 New Endpoint: Check Stock Levels for Products ===
  .get(
    "/stock/check",
    async ({ query, set }) => {
      try {
        const { product_ids } = query;

        if (!product_ids) {
          set.status = 400;
          return {
            error: true,
            message: "product_ids parameter is required",
          };
        }

        const productIdArray = product_ids
          .split(",")
          .map((id) => parseInt(id.trim()));
        const stockInfo = [];

        for (const productId of productIdArray) {
          try {
            const stock = await ProductService.getStockQuantity(productId);
            const productDetails = await ProductService.getProductDetails(
              productId
            );

            stockInfo.push({
              product_id: productId,
              stock_quantity: stock,
              product_name: productDetails?.name || "Unknown",
              sku: productDetails?.sku || "Unknown",
              is_active: productDetails?.is_active || false,
            });
          } catch (error) {
            stockInfo.push({
              product_id: productId,
              error: `Product not found or error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            });
          }
        }

        return {
          success: true,
          stock_info: stockInfo,
        };
      } catch (error: any) {
        console.error("❌ Error checking stock levels:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to check stock levels",
        };
      }
    },
    {
      query: t.Object({
        product_ids: t.String(), // Comma-separated list of product IDs
      }),
    }
  )

  // === 15. 🆕 New Endpoint: Get Low Stock Products ===
  .get(
    "/stock/low",
    async ({ query }) => {
      try {
        const { threshold = 10 } = query;

        const lowStockProducts = await ProductService.getLowStockProducts(
          Number(threshold)
        );

        return {
          success: true,
          threshold: Number(threshold),
          low_stock_products: lowStockProducts,
          count: Array.isArray(lowStockProducts) ? lowStockProducts.length : 0,
        };
      } catch (error: any) {
        console.error("❌ Error fetching low stock products:", error);
        return {
          error: true,
          message: error.message || "Failed to fetch low stock products",
        };
      }
    },
    {
      query: t.Object({
        threshold: t.Optional(t.Numeric()),
      }),
    }
  )

  // === 16. Test Email Configuration ===
  .post("/test-email", async ({ set }) => {
    try {
      const EmailService = (await import("../classes/EmailService")).default;
      const result = await EmailService.testEmailConfiguration();

      if (result.success) {
        return {
          success: true,
          message: "Email test sent successfully",
          details: result.details,
        };
      } else {
        set.status = 500;
        return {
          success: false,
          message: "Email test failed",
          error: result.message,
          details: result.details,
        };
      }
    } catch (error) {
      console.error("❌ Email test endpoint error:", error);
      set.status = 500;
      return {
        success: false,
        message: "Email test endpoint error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // === 17. Health Check Endpoint ===
  .get("/health", async () => {
    return {
      status: "healthy",
      environment,
      timestamp: new Date().toISOString(),
      services: {
        "2c2p_api": getBaseUrl(),
        merchant_id: merchantId ? "configured" : "missing",
        order_service: "integrated",
        payment_transaction_service: "integrated",
        product_service: "integrated",
        email_service: "configured",
      },
      features: {
        payment_logging: "enabled",
        stock_management: "enabled",
        transaction_history: "enabled",
        email_notifications: "enabled",
      },
    };
  })

  // === 18. Debug Environment Variables Endpoint ===
  .get("/debug/env", async () => {
    return {
      env_check: {
        NODE_ENV: process.env.NODE_ENV || "undefined",
        SMTP_USER: process.env.SMTP_USER ? "SET" : "MISSING",
        SMTP_PASS: process.env.SMTP_PASS ? "SET" : "MISSING",
        SMTP_HOST: process.env.SMTP_HOST || "undefined",
        SMTP_PORT: process.env.SMTP_PORT || "undefined",
        FROM_EMAIL: process.env.FROM_EMAIL || "undefined",
        COMPANY_NAME: process.env.COMPANY_NAME || "undefined",
      },
      bun_env_check: {
        NODE_ENV: (Bun as any).env?.NODE_ENV || "undefined",
        SMTP_USER: (Bun as any).env?.SMTP_USER ? "SET" : "MISSING",
        SMTP_PASS: (Bun as any).env?.SMTP_PASS ? "SET" : "MISSING",
        SMTP_HOST: (Bun as any).env?.SMTP_HOST || "undefined",
        SMTP_PORT: (Bun as any).env?.SMTP_PORT || "undefined",
        FROM_EMAIL: (Bun as any).env?.FROM_EMAIL || "undefined",
        COMPANY_NAME: (Bun as any).env?.COMPANY_NAME || "undefined",
      },
      docker_env_vars: {
        // Common Docker environment variables
        HOSTNAME: process.env.HOSTNAME || "undefined",
        PATH: process.env.PATH ? "SET" : "MISSING",
        PWD: process.env.PWD || "undefined",
      },
    };
  });

export default paymentController;
