import { QuotationModel } from "../models/quotationModel";
import db from "@/core/database";

class QuotationService {
  // Get all quotations
  async getAllQuotations(): Promise<QuotationModel[]> {
    const query = `SELECT * FROM quotations ORDER BY issue_date DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as QuotationModel[];
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
      throw new Error("Failed to fetch quotations");
    } finally {
      conn.release();
    }
  }

  // Get quotation by ID
  async getQuotationById(quotation_id: number): Promise<QuotationModel | null> {
    const query = `SELECT * FROM quotations WHERE quotation_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [quotation_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch quotation:", error);
      throw new Error("Failed to fetch quotation");
    } finally {
      conn.release();
    }
  }

  // Get quotations by User ID
  async getQuotationsByUserId(user_id: number): Promise<QuotationModel[]> {
    const query = `SELECT * FROM quotations WHERE user_id = ? ORDER BY issue_date DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as QuotationModel[];
    } catch (error) {
      console.error("Failed to fetch quotations by user ID:", error);
      throw new Error("Failed to fetch quotations by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new quotation
  async createQuotation(
    quotation: Omit<QuotationModel, "quotation_id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO quotations (user_id, quotation_number, issue_date, valid_until, subtotal, tax_amount, total_amount, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        quotation.user_id,
        quotation.quotation_number,
        quotation.issue_date,
        quotation.valid_until,
        quotation.subtotal,
        quotation.tax_amount,
        quotation.total_amount,
        quotation.status,
        quotation.notes,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create quotation:", error);
      throw new Error("Failed to create quotation");
    } finally {
      conn.release();
    }
  }

  // Update quotation
  async updateQuotation(
    quotation_id: number,
    quotation: Partial<Omit<QuotationModel, "quotation_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE quotations
      SET user_id=?, quotation_number=?, issue_date=?, valid_until=?, subtotal=?, tax_amount=?, total_amount=?, status=?, notes=?
      WHERE quotation_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        quotation.user_id,
        quotation.quotation_number,
        quotation.issue_date,
        quotation.valid_until,
        quotation.subtotal,
        quotation.tax_amount,
        quotation.total_amount,
        quotation.status,
        quotation.notes,
        quotation_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update quotation:", error);
      throw new Error("Failed to update quotation");
    } finally {
      conn.release();
    }
  }

  // Delete quotation
  async deleteQuotation(quotation_id: number): Promise<boolean> {
    const query = `DELETE FROM quotations WHERE quotation_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [quotation_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      throw new Error("Failed to delete quotation");
    } finally {
      conn.release();
    }
  }
}

export default new QuotationService();
