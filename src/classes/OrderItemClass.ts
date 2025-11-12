import { OrderItemModel } from "../models/OrderItemModel";
import db from "@/core/database";

class OrderItemService {
  // Get all order items
  async getAllOrderItems(): Promise<OrderItemModel[]> {
    const query = `SELECT * FROM order_items;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as OrderItemModel[];
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      throw new Error("Failed to fetch order items");
    } finally {
      conn.release();
    }
  }

  // Get order item by ID
  async getOrderItemById(item_id: number): Promise<OrderItemModel | null> {
    const query = `SELECT * FROM order_items WHERE item_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [item_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch order item:", error);
      throw new Error("Failed to fetch order item");
    } finally {
      conn.release();
    }
  }

  // Get order items by Order ID
  async getOrderItemsByOrderId(order_id: number): Promise<OrderItemModel[]> {
    const query = `SELECT * FROM order_items WHERE order_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [order_id]);
      return rows as OrderItemModel[];
    } catch (error) {
      console.error("Failed to fetch order items by order ID:", error);
      throw new Error("Failed to fetch order items by order ID");
    } finally {
      conn.release();
    }
  }

  async getOrderItemsAndProductByOrderId(
    order_id: number
  ): Promise<OrderItemModel[]> {
    const query = `SELECT 
              o.*, 
              p.name
            FROM order_items AS o
            JOIN products AS p ON p.product_id = o.product_id
            WHERE o.order_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [order_id]);
      return rows as OrderItemModel[];
    } catch (error) {
      console.error("Failed to fetch order items by order ID:", error);
      throw new Error("Failed to fetch order items by order ID");
    } finally {
      conn.release();
    }
  }

  async getOrderItemToChartAndSumProductItem(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
        SELECT
            oi.product_id,
            p.name AS product_name,
            pc.name AS category_name,
            SUM(oi.quantity) AS total_quantity
        FROM
            order_items AS oi
        JOIN
            orders AS o ON oi.order_id = o.order_id
        JOIN
            products AS p ON oi.product_id = p.product_id
        JOIN
            product_categories AS pc ON p.product_category_id = pc.category_id
        WHERE
            -- ใช้ DATE() เพื่อเปรียบเทียบเฉพาะส่วนของวันที่
            DATE(o.created_at) BETWEEN ? AND ?
            AND o.order_status != 'cancelled'
        GROUP BY
            oi.product_id, p.name, pc.name
        ORDER BY
            total_quantity DESC;`;

    const conn = await db.getConnection();
    try {
      // ส่ง startDate และ endDate ที่เป็น 'YYYY-MM-DD' เข้าไปได้เลย
      const [rows] = await conn.query(query, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
      return rows as any[]; // ควรสร้าง Model ที่ถูกต้องมารับค่า
    } catch (error) {
      console.error("Failed to fetch Product items by Date:", error);
      throw new Error("Failed to fetch Product items by Date");
    } finally {
      conn.release();
    }
  }

  // Create a new order item
  async createOrderItem(
    orderItem: Omit<OrderItemModel, "item_id">
  ): Promise<number> {
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        orderItem.order_id,
        orderItem.product_id,
        orderItem.quantity,
        orderItem.unit_price,
        orderItem.subtotal,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create order item:", error);
      throw new Error("Failed to create order item");
    } finally {
      conn.release();
    }
  }

  // Update order item
  async updateOrderItem(
    item_id: number,
    orderItem: Partial<Omit<OrderItemModel, "item_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE order_items
      SET order_id=?, product_id=?, quantity=?, unit_price=?, subtotal=?
      WHERE item_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        orderItem.order_id,
        orderItem.product_id,
        orderItem.quantity,
        orderItem.unit_price,
        orderItem.subtotal,
        item_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update order item:", error);
      throw new Error("Failed to update order item");
    } finally {
      conn.release();
    }
  }

  // Delete order item
  async deleteOrderItem(item_id: number): Promise<boolean> {
    const query = `DELETE FROM order_items WHERE item_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [item_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete order item:", error);
      throw new Error("Failed to delete order item");
    } finally {
      conn.release();
    }
  }
}

export default new OrderItemService();
