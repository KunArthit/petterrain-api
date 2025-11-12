import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2";
import { OrderModel, OrderItem } from "../models/OrderModel";
import db from "@/core/database";
import UserAddressClass from "./UserAddressClass";
import InvoiceClass from "./InvoiceClass";

type OrderStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "processing"
  | "shipped"
  | "awaiting_payment"
  | "delivered"
  | "cancelled"
  | "completed"
  | "failed";
type PaymentStatus = "pending" | "completed" | "failed";

class OrderService {
  // Get all orders with item counts
  static async getAllOrders(): Promise<OrderModel[]> {
    const query = `
      SELECT o.*, 
             COUNT(oi.item_id) as item_count,
             u.username,
             u.email,
             u.first_name,
             u.last_name,
             u.phone,
             u.user_type_id,
             u.department_id,
             u.company_name,
             u.tax_id,
             u.is_active as user_is_active
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.user_id
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as OrderModel[];
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      throw new Error("Failed to fetch orders");
    } finally {
      conn.release();
    }
  }

  // Get order by ID with items
  static async getOrderById(order_id: number): Promise<OrderModel | null> {
    const conn = await db.getConnection();
    try {
      // Get order details
      const orderQuery = `
      SELECT 
          o.*, 
          u.username AS user_name,
          u.first_name,
          u.last_name
        FROM orders AS o
        JOIN users AS u ON o.user_id = u.user_id
        WHERE o.order_id = ?;
      `;
      const [orderRows]: [any[], any] = await conn.query(orderQuery, [
        order_id,
      ]);

      if (!orderRows.length) {
        return null;
      }

      const order = orderRows[0];

      // Get order items with product details
      const itemsQuery = `
        SELECT oi.*, 
               p.name as product_name, 
               p.sku, 
               p.price as product_price,
               p.sale_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.item_id
      `;
      const [itemsRows] = await conn.query(itemsQuery, [order_id]);

      order.items = itemsRows;
      return order;
    } catch (error) {
      console.error("Failed to fetch order:", error);
      throw new Error("Failed to fetch order");
    } finally {
      conn.release();
    }
  }

  // Get orders by user ID
  static async getOrdersByUserId(user_id: number): Promise<OrderModel[]> {
    const query = `
      SELECT o.*, 
             COUNT(oi.item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ? 
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as OrderModel[];
    } catch (error) {
      console.error("Failed to fetch orders by user ID:", error);
      throw new Error("Failed to fetch orders by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new order with items
  static async createOrder(
    order: Omit<OrderModel, "order_id" | "created_at" | "updated_at">,
    items?: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>
  ): Promise<number> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, order_status, is_bulk_order, bulk_order_type, payment_method, 
          shipping_address_id, billing_address_id, subtotal, shipping_cost, tax_amount, total_amount, 
          tracking_number, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
      `;

      const [orderResult] = await conn.query(orderQuery, [
        order.user_id,
        order.order_status,
        order.is_bulk_order,
        order.bulk_order_type,
        order.payment_method,
        order.shipping_address_id,
        order.billing_address_id,
        order.subtotal,
        order.shipping_cost,
        order.tax_amount,
        order.total_amount,
        order.tracking_number,
        order.notes,
      ]);

      const orderId = (orderResult as any).insertId;

      // Create order items if provided
      if (items && items.length > 0) {
        const itemsQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ?
        `;
        const itemsValues = items.map((item) => [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ]);

        await conn.query(itemsQuery, [itemsValues]);
      }

      await conn.commit();
      return orderId;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to create order:", error);
      throw new Error("Failed to create order");
    } finally {
      conn.release();
    }
  }

  // Update order with items
  static async updateOrderWithItems(
    order_id: number,
    order: Partial<Omit<OrderModel, "order_id" | "created_at">>,
    items?: Array<{
      item_id?: number;
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Update order if there are order fields to update
      if (Object.keys(order).length > 0) {
        const orderFields = Object.keys(order)
          .map((field) => `${field}=?`)
          .join(", ");
        const orderValues = [...Object.values(order), order_id];

        const updateOrderQuery = `
          UPDATE orders
          SET ${orderFields}, updated_at=NOW()
          WHERE order_id=?;
        `;
        await conn.query(updateOrderQuery, orderValues);
      }

      // Update items if provided
      if (items && items.length > 0) {
        // Delete existing items
        await conn.query(`DELETE FROM order_items WHERE order_id=?`, [
          order_id,
        ]);

        // Insert new items
        const itemsQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ?;
        `;
        const itemsValues = items.map((item) => [
          order_id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ]);

        await conn.query(itemsQuery, [itemsValues]);
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to update order and items:", error);
      throw new Error("Failed to update order and items");
    } finally {
      conn.release();
    }
  }

  // Get order items with product details
  static async getOrderItems(order_id: number): Promise<OrderItem[]> {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(
        `
        SELECT oi.item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
               p.name as product_name, p.sku, p.price as product_price, p.sale_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.item_id
        `,
        [order_id]
      );
      return rows as OrderItem[];
    } catch (error) {
      console.error("Failed to get order items:", error);
      throw new Error("Failed to get order items");
    } finally {
      conn.release();
    }
  }

  // Add items to existing order
  static async addOrderItems(
    order_id: number,
    items: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      const itemsQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
        VALUES ?
      `;
      const itemsValues = items.map((item) => [
        order_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);

      await conn.query(itemsQuery, [itemsValues]);
      return true;
    } catch (error) {
      console.error("Failed to add order items:", error);
      throw new Error("Failed to add order items");
    } finally {
      conn.release();
    }
  }

  // Update order (legacy method for backward compatibility)
  static async updateOrder(
    order_id: number,
    order: Partial<Omit<OrderModel, "order_id" | "created_at">>
  ): Promise<boolean> {
    return this.updateOrderWithItems(order_id, order);
  }

  /**
   * Get payment analytics - useful for dashboard
   */
  static async getPaymentAnalytics(days = 30) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as payment_date,
          order_status,
          payment_method,
          COUNT(*) as order_count,
          SUM(total_amount) as total_amount,
          AVG(total_amount) as avg_amount
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at), order_status, payment_method
        ORDER BY payment_date DESC
      `;

      const [rows] = await db.execute(query, [days]);
      return rows;
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
      throw error;
    }
  }

  /**
   * Create order with invoice number for payment integration
   */
  static async createOrderWithInvoice(orderData: {
    invoice_no: string;
    user_id: number;
    order_status: OrderStatus;
    is_bulk_order: boolean;
    bulk_order_type?: string;
    payment_method: string;
    shipping_address_id?: number;
    billing_address_id?: number;
    subtotal: number;
    shipping_cost?: number;
    tax_amount?: number;
    total_amount: number;
    tracking_number?: string;
    notes?: string;
    items?: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Insert order with invoice number
      const orderQuery = `
        INSERT INTO orders (
          invoice_no, user_id, order_status, is_bulk_order, bulk_order_type,
          payment_method, shipping_address_id, billing_address_id,
          subtotal, shipping_cost, tax_amount, total_amount,
          tracking_number, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const orderValues = [
        orderData.invoice_no,
        orderData.user_id,
        orderData.order_status,
        orderData.is_bulk_order,
        orderData.bulk_order_type || null,
        orderData.payment_method,
        orderData.shipping_address_id || null,
        orderData.billing_address_id || null,
        orderData.subtotal,
        orderData.shipping_cost || 0,
        orderData.tax_amount || 0,
        orderData.total_amount,
        orderData.tracking_number || null,
        orderData.notes || null,
      ];

      const [orderResult] = await conn.query(orderQuery, orderValues);
      const orderId = (orderResult as any).insertId;

      // Insert order items if provided
      if (orderData.items && orderData.items.length > 0) {
        const itemsQuery = `
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, subtotal
          ) VALUES ?
        `;

        const itemsValues = orderData.items.map((item) => [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ]);

        await conn.query(itemsQuery, [itemsValues]);
      }

      await conn.commit();
      console.log(
        `✅ Order created with invoice ${orderData.invoice_no}, ID: ${orderId}`
      );
      return orderId;
    } catch (error) {
      await conn.rollback();
      console.error("Error creating order with invoice:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Find order by invoice number
   */
  static async getOrderByInvoiceNo(invoiceNo: string) {
    try {
      const query = `
        SELECT * FROM orders 
        WHERE invoice_no = ? 
        LIMIT 1
      `;
      const [rows]: [any[], any] = await db.execute(query, [invoiceNo]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error fetching order by invoice number:", error);
      throw error;
    }
  }

  /**
   * Delete an order (for rollback scenarios)
   * Fixed: Use correct column name for order table
   */
  static async deleteOrder(orderId: number) {
    try {
      // First delete order items
      await db.execute("DELETE FROM order_items WHERE order_id = ?", [orderId]);

      // Then delete the order - Use correct primary key column name
      const result = await db.execute("DELETE FROM orders WHERE order_id = ?", [
        orderId,
      ]);

      console.log(`🗑️ Order ${orderId} and its items deleted successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Error deleting order ${orderId}:`, error);
      throw error;
    }
  }

  static async deleteOrders(orderIds: number[]) {
    const deletedOrders = [];

    for (const orderId of orderIds) {
      try {
        await db.execute(
          "DELETE FROM payment_transactions WHERE order_id = ?",
          [orderId]
        );
        await db.execute("DELETE FROM order_items WHERE order_id = ?", [
          orderId,
        ]);

        const [result] = await db.execute<ResultSetHeader>(
          "DELETE FROM orders WHERE order_id = ?",
          [orderId]
        );

        if (result.affectedRows > 0) {
          console.log(`🗑️ Order ${orderId} deleted.`);
          deletedOrders.push(orderId);
        } else {
          console.warn(`⚠️ Order ${orderId} not found.`);
        }
      } catch (error) {
        console.error(`❌ Error deleting order ${orderId}:`, error);
        throw error;
      }
    }

    return deletedOrders;
  }

  /**
   * Update order status by order ID
   * Fixed: Use correct column name for order table
   */
  static async updateOrderStatus(orderId: number, status: OrderStatus) {
    try {
      const query = `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`;
      const result = await db.execute(query, [status, orderId]);

      if ((result[0] as any).affectedRows === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }

      console.log(`📝 Order ${orderId} status updated to: ${status}`);
      return result;
    } catch (error) {
      console.error(`❌ Error updating order status for ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get order status by order ID
   * Fixed: Use correct column name for order table
   */
  static async getOrderStatus(orderId: number) {
    try {
      const query = `SELECT order_status FROM orders WHERE order_id = ?`;
      const [rows] = await db.execute(query, [orderId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }

      return rows[0];
    } catch (error) {
      console.error(`❌ Error getting order status for ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get order by invoice number with items
   * FIXED: Works with your actual database schema
   */
  static async getOrderWithItemsByInvoice(invoiceNo: string) {
    try {
      // First get the order - using only columns that exist in your orders table
      const orderQuery = `
        SELECT 
            o.order_id,
            o.invoice_no,
            o.user_id,
            u.username AS user_name,
            o.order_status,
            o.total_amount,
            o.subtotal,
            o.shipping_cost,
            o.tax_amount,
            o.payment_method,
            o.created_at,
            o.updated_at,
            o.notes,
            o.tracking_number,
            o.is_bulk_order,
            o.bulk_order_type,
            o.shipping_address_id,
            o.billing_address_id
          FROM orders AS o
          JOIN users AS u ON o.user_id = u.user_id
          WHERE o.invoice_no = ?
      `;

      const [orderRows] = (await db.execute(orderQuery, [invoiceNo])) as [
        RowDataPacket[],
        FieldPacket[]
      ];

      if (!Array.isArray(orderRows) || orderRows.length === 0) {
        return null;
      }

      const order = orderRows[0];

      // Then get the order items
      const itemsQuery = `
        SELECT oi.*, p.name as product_name, p.sku, p.price as current_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `;

      const [itemRows] = (await db.execute(itemsQuery, [order.order_id])) as [
        RowDataPacket[],
        FieldPacket[]
      ];

      // Attach items to order
      order.items = itemRows || [];

      return order;
    } catch (error) {
      console.error(
        `❌ Error fetching order with items for invoice ${invoiceNo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update payment status - SIMPLIFIED for your schema
   * Since your orders table doesn't have payment_status, transaction_ref, etc.
   * We'll use the notes field to store payment info and update order_status
   */
  static async updatePaymentStatus(
    invoiceNo: string,
    paymentStatus: PaymentStatus,
    paymentDetails: any
  ) {
    try {
      // Map payment status to order status
      let orderStatus: OrderStatus;
      switch (paymentStatus) {
        case "completed":
          orderStatus = "paid";
          break;
        case "failed":
          orderStatus = "failed";
          break;
        case "pending":
        default:
          orderStatus = "pending";
          break;
      }

      // Create payment info for notes
      const paymentInfo = {
        status: paymentStatus,
        transaction_ref: paymentDetails.transaction_ref,
        approval_code: paymentDetails.approval_code,
        amount_paid: paymentDetails.amount_paid,
        payment_date: paymentDetails.payment_date,
        payment_method: paymentDetails.payment_method,
      };

      const paymentNotes = `Payment Status: ${paymentStatus} | ${JSON.stringify(
        paymentInfo
      )}`;

      const query = `
        UPDATE orders 
        SET order_status = ?, notes = ?, updated_at = NOW() 
        WHERE invoice_no = ?
      `;

      const result = await db.execute(query, [
        orderStatus,
        paymentNotes,
        invoiceNo,
      ]);

      if ((result[0] as any).affectedRows === 0) {
        console.error(`⚠️ No order found with invoice number: ${invoiceNo}`);
        return false;
      }

      console.log(
        `📝 Payment status updated for invoice ${invoiceNo}: ${paymentStatus} -> order_status: ${orderStatus}`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Error updating payment status for ${invoiceNo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update order status by invoice number
   * Fixed: Use correct column names
   */
  static async updateOrderStatusByInvoice(
    invoiceNo: string,
    orderStatus: OrderStatus,
    additionalDetails?: any
  ) {
    try {
      const updateFields = [`order_status = ?`, `updated_at = NOW()`];
      const updateValues = [orderStatus];

      // Add additional details if provided
      if (additionalDetails?.tracking_number) {
        updateFields.push(`tracking_number = ?`);
        updateValues.push(additionalDetails.tracking_number);
      }

      if (additionalDetails?.notes) {
        updateFields.push(`notes = ?`);
        updateValues.push(additionalDetails.notes);
      }

      // Add invoice number for WHERE clause
      //@ts-ignore
      updateValues.push(invoiceNo as string);

      const query = `UPDATE orders SET ${updateFields.join(
        ", "
      )} WHERE invoice_no = ?`;
      const result = await db.execute(query, updateValues);

      if ((result[0] as any).affectedRows === 0) {
        console.error(`⚠️ No order found with invoice number: ${invoiceNo}`);
        return false;
      }

      console.log(
        `📝 Order status updated for invoice ${invoiceNo}: ${orderStatus}`
      );
      return true;
    } catch (error) {
      console.error(`❌ Error updating order status for ${invoiceNo}:`, error);
      throw error;
    }
  }

  /**
   * Get orders by order status (not payment status since that column doesn't exist)
   * Fixed: Use correct column names and add proper pagination
   */
  static async getOrdersByPaymentStatus(
    status: OrderStatus,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const query = `
        SELECT order_id, invoice_no, user_id, order_status,
               total_amount, subtotal, shipping_cost, tax_amount,
               payment_method, created_at, updated_at
        FROM orders 
        WHERE order_status = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [status, limit, offset]);
      return rows || [];
    } catch (error) {
      console.error(`❌ Error fetching orders by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Create order for payment (ensure correct return value)
   * Fixed: Return the correct order ID
   */
  static async createOrderForPayment(orderData: any) {
    try {
      // 1. ดึงข้อมูลที่อยู่ทั้งหมดของ user
      const userAddresses = await UserAddressClass.getAddressesByUserId(
        orderData.user_id
      );
      // FIX: เปลี่ยนจาก .filter() เป็น .find() เพื่อให้ได้ผลลัพธ์เป็นอ็อบเจกต์เดียว
      const shippingAddress = userAddresses.find(
        (item) => item.address_id === orderData.shipping_address_id
      );

      const billingAddress = userAddresses.find(
        (item) => item.address_id === orderData.billing_address_id
      );

      // 3. สร้าง Order
      const query = `
      INSERT INTO orders (
        invoice_no, user_id, order_status, is_bulk_order, bulk_order_type,
        payment_method, shipping_address_id, billing_address_id,
        subtotal, shipping_cost, tax_amount, total_amount, notes,
        address, sub_district, district, province, zipcode, phone_number, country, customer_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

      const values = [
        orderData.invoice_no,
        orderData.user_id,
        orderData.order_status,
        orderData.is_bulk_order || false,
        orderData.bulk_order_type || null,
        orderData.payment_method,
        orderData.shipping_address_id,
        orderData.billing_address_id,
        orderData.subtotal,
        orderData.shipping_cost || 0,
        orderData.tax_amount || 0,
        orderData.total_amount,
        orderData.notes || null,
        // ใช้ข้อมูลที่อยู่จาก shippingAddress ที่เราหาเจอ
        shippingAddress?.address_line1,
        shippingAddress?.address_line2,
        shippingAddress?.city,
        shippingAddress?.state,
        shippingAddress?.postal_code,
        orderData.phone_number,
        shippingAddress?.country,
        orderData.customer_name,
      ];

      const result = await db.execute(query, values);
      const insertId = (result[0] as { insertId: number }).insertId;

      if (!insertId) {
        throw new Error("Failed to create order - no insert ID returned");
      }

      // 4. สร้าง body สำหรับ Invoice
      const bodyInvoice = {
        order_id: insertId,
        invoice_no: orderData.invoice_no,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount,
        shipping_cost: orderData.shipping_cost,
        total_amount: orderData.total_amount,
        payment_status: "paid",
        notes: orderData.notes || null,

        // ✅ แก้ไขโดยการเติม || null ให้กับทุก property ที่อาจเป็น undefined
        address: billingAddress?.address_line1 || null,
        sub_district: billingAddress?.address_line2 || null,
        district: billingAddress?.city || null,
        province: billingAddress?.state || null,

        // แก้ไข zipcode และ country ด้วย
        zipcode: billingAddress?.postal_code || null,
        country: billingAddress?.country || null,

        // ข้อมูลส่วนนี้ควรดึงจาก billingAddress เพื่อความถูกต้อง
        phone_number: orderData.phone_number || null,
        customer_name: orderData.customer_name || null,

        tracking: null,
      };

      // 5. สร้าง Invoice
      await InvoiceClass.createInvoice(bodyInvoice);

      console.log(`✅ Order created successfully with ID: ${insertId}`);
      return insertId;
    } catch (error) {
      console.error(`❌ Error creating order:`, error);
      throw error;
    }
  }

  /**
   * Get payment details from order notes (since we store them there)
   * Helper method to extract payment info from notes field
   */
  static extractPaymentDetailsFromNotes(notes: string) {
    try {
      if (!notes || !notes.includes("Payment Status:")) {
        return null;
      }

      const jsonPart = notes.split("Payment Status: ")[1]?.split(" | ")[1];
      if (jsonPart) {
        return JSON.parse(jsonPart);
      }
      return null;
    } catch (error) {
      console.error("Error parsing payment details from notes:", error);
      return null;
    }
  }

  /**
   * Get enhanced order details with parsed payment info
   */
  static async getEnhancedOrderByInvoice(invoiceNo: string) {
    try {
      const order = await this.getOrderWithItemsByInvoice(invoiceNo);
      if (!order) return null;

      // Extract payment details from notes if available
      const paymentDetails = this.extractPaymentDetailsFromNotes(
        order.notes || ""
      );

      // Add payment details to order object for compatibility
      if (paymentDetails) {
        order.transaction_ref = paymentDetails.transaction_ref;
        order.approval_code = paymentDetails.approval_code;
        order.amount_paid = paymentDetails.amount_paid;
        order.payment_date = paymentDetails.payment_date;
      }

      return order;
    } catch (error) {
      console.error(
        `❌ Error fetching enhanced order for invoice ${invoiceNo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update tracking number for an order
   */
  static async updateTrackingNumber(
    order_id: number,
    tracking_number: string
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      const query = `
        UPDATE orders 
        SET tracking_number = ?, updated_at = NOW() 
        WHERE order_id = ?
      `;
      const [result] = await conn.query(query, [tracking_number, order_id]);

      if ((result as any).affectedRows === 0) {
        throw new Error(`Order not found: ${order_id}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to update tracking number:", error);
      throw new Error("Failed to update tracking number");
    } finally {
      conn.release();
    }
  }

  static async updateConfirmPayment(
    order_id: number,
    payment_status: PaymentStatus
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      const query = `
        UPDATE orders 
        SET payment_status = ?, updated_at = NOW() 
        WHERE order_id = ?
      `;
      const [result] = await conn.query(query, [payment_status, order_id]);

      if ((result as any).affectedRows === 0) {
        throw new Error(`Order not found: ${order_id}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to update payment_status :", error);
      throw new Error("Failed to update payment_status ");
    } finally {
      conn.release();
    }
  }
}

export default OrderService;
export type { OrderStatus, PaymentStatus };
