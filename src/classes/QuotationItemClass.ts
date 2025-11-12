import { RowDataPacket } from "mysql2";
import { QuotationItemModel } from "../models/QuotationItemModel";
import db from "@/core/database";

class QuotationItemService {
  // Get all quotation items
  async getAllQuotationItems(): Promise<QuotationItemModel[]> {
    const query = `SELECT * FROM quotation_items ORDER BY item_id ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as QuotationItemModel[];
    } catch (error) {
      console.error("Failed to fetch quotation items:", error);
      throw new Error("Failed to fetch quotation items");
    } finally {
      conn.release();
    }
  }

  // Get quotation item by ID
  async getQuotationItemById(
    item_id: number
  ): Promise<QuotationItemModel | null> {
    const query = `SELECT * FROM quotation_items WHERE item_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(query, [item_id]);
      return rows.length ? (rows[0] as QuotationItemModel) : null;
    } catch (error) {
      console.error("Failed to fetch quotation item:", error);
      throw new Error("Failed to fetch quotation item");
    } finally {
      conn.release();
    }
  }

  // Get items by Quotation ID
  async getItemsByQuotationId(
    quotation_id: number
  ): Promise<QuotationItemModel[]> {
    const query = `SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY item_id ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [quotation_id]);
      return rows as QuotationItemModel[];
    } catch (error) {
      console.error("Failed to fetch items by quotation ID:", error);
      throw new Error("Failed to fetch items by quotation ID");
    } finally {
      conn.release();
    }
  }

  // Create a new quotation item
  async createQuotationItem(
    item: Omit<QuotationItemModel, "item_id">
  ): Promise<number> {
    const query = `
      INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        item.quotation_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create quotation item:", error);
      throw new Error("Failed to create quotation item");
    } finally {
      conn.release();
    }
  }

  // Update quotation item
  async updateQuotationItem(
    item_id: number,
    item: Partial<Omit<QuotationItemModel, "item_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE quotation_items
      SET quotation_id=?, product_id=?, quantity=?, unit_price=?, subtotal=?
      WHERE item_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        item.quotation_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
        item_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update quotation item:", error);
      throw new Error("Failed to update quotation item");
    } finally {
      conn.release();
    }
  }

  // Delete quotation item
  async deleteQuotationItem(item_id: number): Promise<boolean> {
    const query = `DELETE FROM quotation_items WHERE item_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [item_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete quotation item:", error);
      throw new Error("Failed to delete quotation item");
    } finally {
      conn.release();
    }
  }
}

export default new QuotationItemService();
