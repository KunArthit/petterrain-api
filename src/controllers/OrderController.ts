import { Elysia, t } from "elysia";
import OrderService from "../classes/OrderClass";
import {
  OrderModel,
  OrderStatus,
  PaymentMethod,
} from "../models/OrderModel";
import EmailService from "@/classes/EmailService";
import db from "@/core/database";

type BulkOrderType = "solution" | "equipment";
type PaymentStatus = "pending" | "completed" | "failed";

// Helper function to map payment methods from frontend to database enum
const mapPaymentMethodFromFrontend = (method: string): PaymentMethod => {
  const methodMap: Record<string, PaymentMethod> = {
    "2c2p": "credit_card",
    bank: "bank_transfer",
  };

  return methodMap[method] || "credit_card";
};

// Helper function to map order status
const mapOrderStatusFromFrontend = (status: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    pending: "pending",
    confirmed: "paid",
    processing: "processing",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    failed: "cancelled",
  };

  return statusMap[status] || "pending";
};

// Type-safe update interface that accepts strings but converts them internally
interface OrderUpdateInput {
  user_id?: number;
  order_status?: string;
  is_bulk_order?: boolean;
  bulk_order_type?: string;
  payment_method?: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  total_amount?: number;
  tracking_number?: string;
  notes?: string;
}

// Helper function to convert OrderUpdateInput to proper OrderModel type
const convertToOrderModel = (
  input: OrderUpdateInput
): Partial<Omit<OrderModel, "order_id" | "created_at">> => {
  const result: Partial<Omit<OrderModel, "order_id" | "created_at">> = {};

  if (input.user_id !== undefined) result.user_id = input.user_id;
  if (input.is_bulk_order !== undefined)
    result.is_bulk_order = input.is_bulk_order;
  if (input.bulk_order_type !== undefined)
    result.bulk_order_type = input.bulk_order_type;
  if (input.shipping_address_id !== undefined)
    result.shipping_address_id = input.shipping_address_id;
  if (input.billing_address_id !== undefined)
    result.billing_address_id = input.billing_address_id;
  if (input.subtotal !== undefined) result.subtotal = input.subtotal;
  if (input.shipping_cost !== undefined)
    result.shipping_cost = input.shipping_cost;
  if (input.tax_amount !== undefined) result.tax_amount = input.tax_amount;
  if (input.total_amount !== undefined)
    result.total_amount = input.total_amount;
  if (input.tracking_number !== undefined)
    result.tracking_number = input.tracking_number;
  if (input.notes !== undefined) result.notes = input.notes;

  // Handle type conversions
  if (input.payment_method !== undefined) {
    result.payment_method = mapPaymentMethodFromFrontend(input.payment_method);
  }
  if (input.order_status !== undefined) {
    result.order_status = mapOrderStatusFromFrontend(input.order_status);
  }

  return result;
};

const orderController = new Elysia({
  prefix: "/order",
  tags: ["Order"],
})
  // Get all orders
  .get("/", async () => {
    try {
      return await OrderService.getAllOrders();
    } catch (error) {
      throw new Error("Failed to fetch orders");
    }
  })

  // Get order by ID with items
  .get("/:id", async ({ params }) => {
    try {
      const order = await OrderService.getOrderById(Number(params.id));
      if (!order) throw new Error("Order not found");
      return order;
    } catch (error) {
      throw new Error("Failed to fetch order");
    }
  })

  // Get order by invoice number
  .get("/invoice/:invoiceNo", async ({ params, set }) => {
    try {
      const order = await OrderService.getOrderByInvoiceNo(params.invoiceNo);
      if (!order) {
        set.status = 404;
        return { error: true, message: "Order not found" };
      }
      return { success: true, order };
    } catch (error: any) {
      set.status = 500;
      return { error: true, message: "Failed to fetch order" };
    }
  })

  // Get order with items by invoice number
  .get("/invoice/:invoiceNo/items", async ({ params, set }) => {
    try {
      const order = await OrderService.getOrderWithItemsByInvoice(
        params.invoiceNo
      );
      if (!order) {
        set.status = 404;
        return { error: true, message: "Order not found" };
      }
      return { success: true, order };
    } catch (error: any) {
      set.status = 500;
      return { error: true, message: "Failed to fetch order with items" };
    }
  })

  // Get orders by User ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await OrderService.getOrdersByUserId(Number(params.user_id));
    } catch (error) {
      throw new Error("Failed to fetch orders for user");
    }
  })

  // Get order items by order ID
  .get("/:id/items", async ({ params }) => {
    try {
      const orderId = Number(params.id);
      const items = await OrderService.getOrderItems(orderId);
      return {
        order_id: orderId,
        items,
      };
    } catch (error) {
      console.error("Error fetching order items:", error);
      throw new Error("Failed to fetch order items");
    }
  })

  // Create order with items
  .post(
    "/",
    async ({ body }) => {
      try {
        const mappedPaymentMethod = mapPaymentMethodFromFrontend(
          body.payment_method
        );
        const mappedOrderStatus = mapOrderStatusFromFrontend(body.order_status);

        const orderId = await OrderService.createOrder(
          {
            user_id: body.user_id,
            order_status: mappedOrderStatus,
            is_bulk_order: body.is_bulk_order,
            bulk_order_type: body.bulk_order_type ?? null,
            payment_method: mappedPaymentMethod,
            shipping_address_id: body.shipping_address_id ?? null,
            billing_address_id: body.billing_address_id ?? null,
            subtotal: body.subtotal,
            shipping_cost: body.shipping_cost ?? null,
            tax_amount: body.tax_amount ?? null,
            total_amount: body.total_amount,
            tracking_number: body.tracking_number ?? null,
            notes: body.notes ?? null,
          },
          body.items // Pass items if provided
        );
        return { message: "Order created", order_id: orderId };
      } catch (error) {
        console.error("Error creating order:", error);
        throw new Error("Failed to create order");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        order_status: t.String(),
        is_bulk_order: t.Boolean(),
        bulk_order_type: t.Optional(t.String()),
        payment_method: t.String(),
        shipping_address_id: t.Optional(t.Number()),
        billing_address_id: t.Optional(t.Number()),
        subtotal: t.Number(),
        shipping_cost: t.Optional(t.Number()),
        tax_amount: t.Optional(t.Number()),
        total_amount: t.Number(),
        tracking_number: t.Optional(t.String()),
        notes: t.Optional(t.String()),
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
      }),
    }
  )

  // Create order with invoice number (for payment integration)
  .post(
    "/payment",
    async ({ body, set }) => {
      try {
        const invoiceNo = body.invoice_no || `INV-${Date.now()}`;
        const mappedPaymentMethod = mapPaymentMethodFromFrontend(
          body.payment_method
        );
        const mappedOrderStatus = mapOrderStatusFromFrontend(
          body.order_status || "pending"
        );

        let validatedBulkOrderType: BulkOrderType | undefined = undefined;
        if (body.bulk_order_type) {
          const validBulkTypes: BulkOrderType[] = ["solution", "equipment"];
          validatedBulkOrderType = validBulkTypes.includes(
            body.bulk_order_type as BulkOrderType
          )
            ? (body.bulk_order_type as BulkOrderType)
            : undefined;
        }

        const orderId = await OrderService.createOrderForPayment({
          invoice_no: invoiceNo,
          user_id: body.user_id,
          order_status: mappedOrderStatus,
          is_bulk_order: body.is_bulk_order || false,
          bulk_order_type: validatedBulkOrderType,
          payment_method: mappedPaymentMethod,
          shipping_address_id: body.shipping_address_id ?? undefined,
          billing_address_id: body.billing_address_id ?? undefined,
          subtotal: body.subtotal,
          shipping_cost: body.shipping_cost || 0,
          tax_amount: body.tax_amount || 0,
          total_amount: body.total_amount,
          notes: body.notes ?? undefined,
        });

        return {
          success: true,
          message: "Payment order created",
          order_id: orderId,
          invoice_no: invoiceNo,
        };
      } catch (error: any) {
        console.error("Error creating payment order:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to create payment order",
        };
      }
    },
    {
      body: t.Object({
        invoice_no: t.Optional(t.String()),
        user_id: t.Number(),
        order_status: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("awaiting_payment"),
            t.Literal("paid"),
            t.Literal("processing"),
            t.Literal("shipped"),
            t.Literal("delivered"),
            t.Literal("cancelled"),
          ])
        ),
        is_bulk_order: t.Optional(t.Boolean()),
        bulk_order_type: t.Optional(
          t.Union([t.Literal("solution"), t.Literal("equipment")])
        ),
        payment_method: t.String(),
        shipping_address_id: t.Optional(t.Number()),
        billing_address_id: t.Optional(t.Number()),
        subtotal: t.Number(),
        shipping_cost: t.Optional(t.Number()),
        tax_amount: t.Optional(t.Number()),
        total_amount: t.Number(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/orderTransaction",
    async ({ body, set }) => {
      try {
        console.log(body);

        // ดึงเฉพาะ rows ออกมา
        const [rowsAddress] = await db.execute(
          `SELECT ua.*, u.email, u.phone
            FROM user_addresses as ua
            JOIN users AS u ON u.user_id = ua.user_id
            WHERE ua.user_id = ?
            AND is_default = 1`,
          [body.user_id]
        );

        const [resTracking] = await db.execute(
          `SELECT tracking_number FROM orders WHERE order_id = ?`,
          [body.order_id]
        );

        //  console.log("RES Tracking",resTracking[0]);
        // ดึงแถวแรกออกมา (เพราะ is_default = 1 จะได้แค่รายการเดียว)
        const addressRow = (rowsAddress as any[])[0] || null;
        const fullAddress = `${addressRow.address_line1} ${addressRow.address_line2}, ${addressRow.city}, ${addressRow.state} ${addressRow.postal_code}, ${addressRow.country}`;
        const tracking = (resTracking as any[])[0] || null;

        console.log(tracking);

        const [rows] = await db.execute(
          `SELECT 
              oi.*, 
              pi.image_url, 
              p.name
          FROM 
              order_items AS oi
          JOIN 
              (
                  SELECT 
                      product_id, 
                      MIN(image_id) AS first_image_id
                  FROM 
                      product_images
                  GROUP BY 
                      product_id
              ) AS pi_first ON oi.product_id = pi_first.product_id
          JOIN 
              product_images AS pi ON pi.product_id = pi_first.product_id AND pi.image_id = pi_first.first_image_id
          JOIN 
              products AS p ON p.product_id = oi.product_id
          WHERE 
              oi.order_id = ?;`,
          [body.order_id]
        );

        const itemsArray = rows as any[];

        const items = itemsArray.map((item: any) => ({
          productId: item.product_id,
          quantity: item.quantity,
          productName: item.name,
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal),
          image: item.image_url,
        }));

        await EmailService.sendOrderTransaction({
          order_id: body.order_id,
          invoice_no: body.invoice_no,
          user_id: body.user_id,
          user_email: body.email,
          order_status: body.order_status,
          user_name: `${body.first_name} ${body.last_name}`,
          address: fullAddress || "ไม่มีข้อมูลที่อยู่",
          is_bulk_order: body.is_bulk_order,
          bulk_order_type: body.bulk_order_type,
          payment_method: body.payment_method,
          subtotal: body.subtotal,
          shipping_cost: body.shipping_cost,
          tax_amount: body.tax_amount,
          total_amount: body.total_amount,
          tracking_number: tracking.tracking_number,
          notes: body.notes,
          created_at: body.created_at,
          updated_at: body.updated_at,
          phone: addressRow.phone || "-",
          orderItems: items?.length ? items : [], // ✅ ใส่ [] ถ้าไม่มีข้อมูล
        });

        console.log("pass transaction");

        return {
          success: true,
          message: "Email Send",
          // order_id: orderId,
          // invoice_no: invoiceNo,
        };
      } catch (error: any) {
        console.error("Error creating payment order:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to create payment order",
        };
      }
    },
    {
      body: t.Object({
        order_id: t.Number(),
        invoice_no: t.String(),
        user_id: t.Number(),
        username: t.String(),
        email: t.String(),
        first_name: t.String(),
        last_name: t.String(),
        phone: t.String(),
        user_type_id: t.Number(),
        department_id: t.Number(),
        company_name: t.String(),
        tax_id: t.String(),
        user_is_active: t.Number(), // หรือ t.Boolean() ถ้าแปลงฝั่ง client
        order_status: t.String(),
        is_bulk_order: t.Number(), // หรือ t.Boolean()
        bulk_order_type: t.String(),
        payment_method: t.String(),
        shipping_address_id: t.Number(),
        billing_address_id: t.Number(),
        subtotal: t.String(),
        shipping_cost: t.String(),
        tax_amount: t.String(),
        total_amount: t.String(),
        tracking_number: t.Union([t.String(), t.Null()]),
        notes: t.String(),
        created_at: t.String(), // หรือ t.Date()
        updated_at: t.String(),
        item_count: t.Number(),
      }),
    }
  )

  .post(
    "/sendMail",
    async ({ body, set }) => {
      try {
        console.log(body);

        // ดึงเฉพาะ rows ออกมา

        const [order] = await db.execute(
          `SELECT * FROM orders WHERE invoice_no = ?`,
          [body.invoice_no]
        );
        const orderData = (order as any[])[0] || null;
        console.log(orderData);

        const [rawAddress] = await db.execute(
          `SELECT ua.*, u.email, u.first_name, u.last_name, u.phone
            FROM user_addresses as ua
            JOIN users AS u ON u.user_id = ua.user_id
            WHERE ua.user_id = ?
            AND is_default = 1`,
          [orderData.user_id]
        );
        const addressRow = (rawAddress as any[])[0] || null;
        const fullAddress = `${addressRow.address_line1} ${addressRow.address_line2}, ${addressRow.city}, ${addressRow.state} ${addressRow.postal_code}, ${addressRow.country}`;

        const [rawOrderItems] = await db.execute(
          `SELECT * FROM order_items AS oi
                  JOIN product_images AS pi ON oi.product_id = pi.product_id
                  JOIN products AS p ON p.product_id = oi.product_id
                  WHERE order_id = ?
                  GROUP BY pi.product_id`,
          [orderData.order_id]
        );

        const itemsArray = rawOrderItems as any[];

        const items = itemsArray.map((item: any) => ({
          productId: item.product_id,
          quantity: item.quantity,
          productName: item.name,
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal),
          image: item.image_url,
        }));

        await EmailService.sendOrderTransaction({
          order_id: orderData.order_id,
          invoice_no: body.invoice_no,
          user_id: orderData.user_id,
          user_email: addressRow.email,
          order_status: orderData.order_status,
          user_name: `${addressRow.first_name} ${addressRow.last_name}`,
          address: fullAddress || "ไม่มีข้อมูลที่อยู่",
          is_bulk_order: orderData.is_bulk_order,
          bulk_order_type: orderData.bulk_order_type,
          payment_method: orderData.payment_method,
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          tax_amount: orderData.tax_amount,
          total_amount: orderData.total_amount,
          tracking_number: null,
          notes: orderData.notes,
          created_at: orderData.created_at,
          updated_at: orderData.updated_at,
          phone: addressRow.phone || "-",
          orderItems: items?.length ? items : [], // ✅ ใส่ [] ถ้าไม่มีข้อมูล
        });

        console.log("pass transaction");

        return {
          success: true,
          message: "Email Send",
          // order_id: orderId,
          // invoice_no: invoiceNo,
        };
      } catch (error: any) {
        console.error("Error creating payment order:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to create payment order",
        };
      }
    },
    {
      body: t.Object({
        invoice_no: t.String(),
      }),
    }
  )

  // Add order items to existing order
  .post(
    "/:orderId/items",
    async ({ params, body, set }) => {
      try {
        const orderId = Number(params.orderId);
        const { items } = body;

        const success = await OrderService.addOrderItems(orderId, items);

        if (!success) {
          set.status = 500;
          return {
            error: true,
            message: "Failed to add order items",
          };
        }

        return {
          success: true,
          message: "Order items added successfully",
          order_id: orderId,
          items_count: items.length,
        };
      } catch (error: any) {
        console.error("Error adding order items:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to add order items",
        };
      }
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      body: t.Object({
        items: t.Array(
          t.Object({
            product_id: t.Number(),
            quantity: t.Number(),
            unit_price: t.Number(),
            subtotal: t.Number(),
          })
        ),
      }),
    }
  )

  // Update order payment status (for webhook integration)
  .patch(
    "/payment/:invoiceNo",
    async ({ params, body, set }) => {
      try {
        const { invoiceNo } = params;
        const { payment_status, payment_details } = body;

        const validPaymentStatuses: PaymentStatus[] = [
          "pending",
          "completed",
          "failed",
        ];
        if (!validPaymentStatuses.includes(payment_status)) {
          set.status = 400;
          return { error: true, message: "Invalid payment status" };
        }

        const updated = await OrderService.updatePaymentStatus(
          invoiceNo,
          payment_status,
          payment_details
        );

        if (!updated) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        return {
          success: true,
          message: "Payment status updated",
          invoice_no: invoiceNo,
          payment_status,
        };
      } catch (error: any) {
        console.error("Error updating payment status:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to update payment status",
        };
      }
    },
    {
      params: t.Object({
        invoiceNo: t.String(),
      }),
      body: t.Object({
        payment_status: t.Union([
          t.Literal("pending"),
          t.Literal("completed"),
          t.Literal("failed"),
        ]),
        payment_details: t.Optional(
          t.Object({
            transaction_ref: t.Optional(t.String()),
            approval_code: t.Optional(t.String()),
            payment_method: t.Optional(t.String()),
            amount_paid: t.Optional(t.Number()),
            payment_date: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  //update order status by invoice number
  .patch(
    "/updateStatus",
    async ({ body, set }) => {
      try {
        const { invoice_no, order_status, tracking_number, notes } = body;

        const updated = await OrderService.updateOrderStatusByInvoice(
          invoice_no,
          order_status,
          { tracking_number, notes }
        );

        if (!updated) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        return {
          success: true,
          message: `Order ${invoice_no} updated to ${order_status}`,
          invoice_no,
          order_status,
        };
      } catch (error: any) {
        console.error("❌ Error updating order status:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to update order status",
        };
      }
    },
    {
      // 👇 2. นำ Enum มาใช้ใน Schema ได้เลย
      body: t.Object({
        invoice_no: t.String(),
        order_status: t.Union([
          t.Literal("pending"),
          t.Literal("awaiting_payment"),
          t.Literal("paid"),
          t.Literal("confirmed"),
          t.Literal("processing"),
          t.Literal("shipped"),
          t.Literal("delivered"),
          t.Literal("cancelled"),
          t.Literal("failed"),
          t.Literal("completed"),
        ]),
        tracking_number: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // Update order status by invoice number
  .patch(
    "/status/:invoiceNo",
    async ({ params, body, set }) => {
      try {
        const { invoiceNo } = params;
        const { order_status, payment_details } = body;

        const validOrderStatuses: OrderStatus[] = [
          "pending",
          "awaiting_payment",
          "paid",
          "confirmed",
          "completed",
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

        const updated = await OrderService.updateOrderStatusByInvoice(
          invoiceNo,
          order_status,
          payment_details
        );

        if (!updated) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        return {
          success: true,
          message: "Order status updated",
          invoice_no: invoiceNo,
          order_status,
        };
      } catch (error: any) {
        console.error("Error updating order status:", error);
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
          t.Literal("awaiting_payment"),
          t.Literal("paid"),
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

  .patch(
    "/vertify-payment/:orderId",
    async ({ params, body, set }) => {
      try {
        const { orderId } = params;
        // รับค่า payment_status จาก body (ไม่มี payment_details แล้ว)
        const { payment_status } = body;

        const updated = await OrderService.updateConfirmPayment(
          Number(orderId),
          payment_status
        );

        if (!updated) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        return {
          success: true,
          message: "Payment status updated",
          order_id: orderId,
          payment_status: payment_status,
        };
      } catch (error: any) {
        console.error("Error updating payment status:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to update payment status",
        };
      }
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      // FIX: ปรับแก้ body schema ให้กระชับและถูกต้อง
      body: t.Object({
        payment_status: t.Union([
          t.Literal("pending"),
          t.Literal("completed"),
          t.Literal("failed"),
        ]),
        // ถ้าไม่ต้องการส่ง payment_details แล้ว ก็สามารถลบบรรทัดนี้ออกได้เลย
        // แต่ถ้ายังต้องการส่งข้อมูลอื่น (เช่น notes) ก็เก็บไว้ได้
      }),
    }
  )

  // Update tracking number for an order
  .patch(
    "/:id/tracking",
    async ({ params, body, set }) => {
      try {
        const orderId = Number(params.id);
        const { tracking_number } = body;

        const success = await OrderService.updateTrackingNumber(
          orderId,
          tracking_number
        );

        if (!success) {
          set.status = 404;
          return { error: true, message: "Order not found" };
        }

        return {
          success: true,
          message: "Tracking number updated",
          order_id: orderId,
          tracking_number,
        };
      } catch (error: any) {
        console.error("Error updating tracking number:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to update tracking number",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        tracking_number: t.String(),
      }),
    }
  )

  // Get orders by payment status (for admin dashboard)
  .get(
    "/status/:status",
    async ({ params, query, set }) => {
      try {
        const { status } = params;
        const { limit = 50, offset = 0 } = query;

        const validOrderStatuses: OrderStatus[] = [
          "pending",
          "awaiting_payment",
          "paid",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "failed",
          "completed",
        ];
        if (!validOrderStatuses.includes(status as OrderStatus)) {
          set.status = 400;
          return { error: true, message: "Invalid order status" };
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
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to fetch orders by status",
        };
      }
    },
    {
      params: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("awaiting_payment"),
          t.Literal("paid"),
          t.Literal("confirmed"),
          t.Literal("processing"),
          t.Literal("shipped"),
          t.Literal("delivered"),
          t.Literal("cancelled"),
          t.Literal("failed"),
          t.Literal("completed"),
        ]),
      }),
      query: t.Object({
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
    }
  )

  // Update order with items - TYPE-SAFE VERSION
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const orderId = Number(params.id);
        const { order, items } = body;

        // Use the helper function to convert input to proper types
        const mappedOrder = convertToOrderModel(order);

        const success = await OrderService.updateOrderWithItems(
          orderId,
          mappedOrder,
          items
        );

        if (!success) {
          throw new Error("Order update failed");
        }

        return {
          message: "Order and items updated successfully",
          order_id: orderId,
        };
      } catch (error) {
        console.error("Error updating order with items:", error);
        throw new Error("Failed to update order with items");
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        order: t.Object({
          user_id: t.Optional(t.Number()),
          order_status: t.Optional(t.String()),
          is_bulk_order: t.Optional(t.Boolean()),
          bulk_order_type: t.Optional(t.String()),
          payment_method: t.Optional(t.String()),
          shipping_address_id: t.Optional(t.Number()),
          billing_address_id: t.Optional(t.Number()),
          subtotal: t.Optional(t.Number()),
          shipping_cost: t.Optional(t.Number()),
          tax_amount: t.Optional(t.Number()),
          total_amount: t.Optional(t.Number()),
          tracking_number: t.Optional(t.String()),
          notes: t.Optional(t.String()),
        }),
        items: t.Optional(
          t.Array(
            t.Object({
              item_id: t.Optional(t.Number()),
              product_id: t.Number(),
              quantity: t.Number(),
              unit_price: t.Number(),
              subtotal: t.Number(),
            })
          )
        ),
      }),
    }
  )

  // Delete order
  .delete("/:id", async ({ params }) => {
    try {
      const success = await OrderService.deleteOrder(Number(params.id));
      if (!success) throw new Error("Order deletion failed");
      return { message: "Order deleted" };
    } catch (error) {
      throw new Error("Failed to delete order");
    }
  })

  .post(
    "/delete",
    async ({ body, set }) => {
      try {
        const { order_ids } = body;

        const deleted = await OrderService.deleteOrders(order_ids);

        return {
          success: true,
          message: "Orders deleted successfully",
          deleted_count: deleted.length,
        };
      } catch (error: any) {
        console.error("Error deleting orders:", error);
        set.status = 500;
        return {
          error: true,
          message: error.message || "Failed to delete orders",
        };
      }
    },
    {
      body: t.Object({
        order_ids: t.Array(t.Number()),
      }),
    }
  )

  // Get payment analytics
  .get("/analytics/payment", async ({ query }) => {
    try {
      const { days = 30 } = query;
      const analytics = await OrderService.getPaymentAnalytics(Number(days));
      return {
        success: true,
        analytics,
        period_days: Number(days),
      };
    } catch (error: any) {
      console.error("Error fetching payment analytics:", error);
      throw new Error("Failed to fetch payment analytics");
    }
  });

export default orderController;
