import { PaymentTransactionModel } from "../models/PaymentTransactionModel";
import db from "@/core/database";
import { RowDataPacket, FieldPacket } from "mysql2";

class PaymentTransactionService {
  // Get all payment transactions
  async getAllTransactions(): Promise<PaymentTransactionModel[]> {
    const query = `SELECT * FROM payment_transactions;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as PaymentTransactionModel[];
    } catch (error: unknown) {
      console.error("Failed to fetch payment transactions:", error);
      throw new Error("Failed to fetch payment transactions");
    } finally {
      conn.release();
    }
  }

  // Get payment transaction by ID
  async getTransactionById(
    transaction_id: number
  ): Promise<PaymentTransactionModel | null> {
    const query = `SELECT * FROM payment_transactions WHERE transaction_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(query, [transaction_id]);
      return rows.length > 0 ? (rows[0] as PaymentTransactionModel) : null;
    } catch (error: unknown) {
      console.error("Failed to fetch payment transaction:", error);
      throw new Error("Failed to fetch payment transaction");
    } finally {
      conn.release();
    }
  }

  // Get payment transactions by Order ID
  async getTransactionsByOrderId(
    order_id: number
  ): Promise<PaymentTransactionModel[]> {
    const query = `SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [order_id]);
      return rows as PaymentTransactionModel[];
    } catch (error) {
      console.error("Failed to fetch payment transactions by order ID:", error);
      throw new Error("Failed to fetch payment transactions by order ID");
    } finally {
      conn.release();
    }
  }

  // Create a new payment transaction
  async createTransaction(
    transaction: Omit<PaymentTransactionModel, "transaction_id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO payment_transactions (order_id, amount, payment_method, transaction_status, 
        transaction_reference, payment_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        transaction.order_id,
        transaction.amount,
        transaction.payment_method,
        transaction.transaction_status,
        transaction.transaction_reference,
        transaction.payment_date,
        transaction.notes,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create payment transaction:", error);
      throw new Error("Failed to create payment transaction");
    } finally {
      conn.release();
    }
  }

  // Update payment transaction
  async updateTransaction(
    transaction_id: number,
    transaction: Partial<
      Omit<PaymentTransactionModel, "transaction_id" | "created_at">
    >
  ): Promise<boolean> {
    const query = `
      UPDATE payment_transactions
      SET order_id=?, amount=?, payment_method=?, transaction_status=?, 
          transaction_reference=?, payment_date=?, notes=?
      WHERE transaction_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        transaction.order_id,
        transaction.amount,
        transaction.payment_method,
        transaction.transaction_status,
        transaction.transaction_reference,
        transaction.payment_date,
        transaction.notes,
        transaction_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update payment transaction:", error);
      throw new Error("Failed to update payment transaction");
    } finally {
      conn.release();
    }
  }

  // Delete payment transaction
  async deleteTransaction(transaction_id: number): Promise<boolean> {
    const query = `DELETE FROM payment_transactions WHERE transaction_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [transaction_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete payment transaction:", error);
      throw new Error("Failed to delete payment transaction");
    } finally {
      conn.release();
    }
  }
}

export default new PaymentTransactionService();
