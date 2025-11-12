import { CreditTermModel } from "../models/CreditTermModel";
import db from "@/core/database";

class CreditTermService {
  // Get all credit terms
  async getAllCreditTerms(): Promise<CreditTermModel[]> {
    const query = `SELECT * FROM credit_terms;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as CreditTermModel[];
    } catch (error) {
      console.error("Failed to fetch credit terms:", error);
      throw new Error("Failed to fetch credit terms");
    } finally {
      conn.release();
    }
  }

  // Get credit term by ID
  async getCreditTermById(term_id: number): Promise<CreditTermModel | null> {
    const query = `SELECT * FROM credit_terms WHERE term_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [term_id]);
      return rows.length > 0 ? (rows[0] as CreditTermModel) : null;
    } catch (error) {
      console.error("Failed to fetch credit term:", error);
      throw new Error("Failed to fetch credit term");
    } finally {
      conn.release();
    }
  }

  // Get credit terms by user ID
  async getCreditTermsByUserId(user_id: number): Promise<CreditTermModel[]> {
    const query = `SELECT * FROM credit_terms WHERE user_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as CreditTermModel[];
    } catch (error) {
      console.error("Failed to fetch credit terms by user ID:", error);
      throw new Error("Failed to fetch credit terms by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new credit term
  async createCreditTerm(
    term: Omit<CreditTermModel, "term_id" | "created_at" | "updated_at">
  ): Promise<number> {
    const query = `
      INSERT INTO credit_terms (user_id, credit_limit, payment_term_days, is_active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        term.user_id,
        term.credit_limit,
        term.payment_term_days,
        term.is_active,
        term.notes,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create credit term:", error);
      throw new Error("Failed to create credit term");
    } finally {
      conn.release();
    }
  }

  // Update credit term
  async updateCreditTerm(
    term_id: number,
    term: Partial<Omit<CreditTermModel, "term_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE credit_terms
      SET user_id=?, credit_limit=?, payment_term_days=?, is_active=?, notes=?, updated_at=NOW()
      WHERE term_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        term.user_id,
        term.credit_limit,
        term.payment_term_days,
        term.is_active,
        term.notes,
        term_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update credit term:", error);
      throw new Error("Failed to update credit term");
    } finally {
      conn.release();
    }
  }

  // Delete credit term
  async deleteCreditTerm(term_id: number): Promise<boolean> {
    const query = `DELETE FROM credit_terms WHERE term_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [term_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete credit term:", error);
      throw new Error("Failed to delete credit term");
    } finally {
      conn.release();
    }
  }
}

export default new CreditTermService();
