import { BankTransferModel } from "../models/BankTransferModel";
import db from "@/core/database";
import { ResultSetHeader } from "mysql2";

class BankTransferService {
  // 🔍 Get all bank transfers
  async getAllBankTransfers(): Promise<BankTransferModel[]> {
    const query = `SELECT * FROM bank_transfers ORDER BY uploaded_at DESC`;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as BankTransferModel[];
    } finally {
      conn.release();
    }
  }

  // 🔍 Get one by ID
  async getBankTransferById(transfer_id: number): Promise<BankTransferModel | null> {
    const query = `SELECT * FROM bank_transfers WHERE transfer_id = ?`;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [transfer_id]);
      const results = rows as BankTransferModel[];
      return results.length > 0 ? results[0] : null;
    } finally {
      conn.release();
    }
  }

  // ➕ Create new bank transfer
  async createBankTransfer(data: Omit<BankTransferModel, "transfer_id">): Promise<number> {
    const query = `
      INSERT INTO bank_transfers (
        order_id, user_id, reference, slip_filename, slip_path, uploaded_at,
        verified_at, verified_by, status, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query<ResultSetHeader>(query, [
        data.order_id,
        data.user_id,
        data.reference,
        data.slip_filename,
        data.slip_path,
        data.uploaded_at,
        data.verified_at,
        data.verified_by,
        data.status,
        data.note,
      ]);
      return result.insertId;
    } finally {
      conn.release();
    }
  }

  // ✏️ Update existing bank transfer
  async updateBankTransfer(transfer_id: number, data: Partial<BankTransferModel>): Promise<boolean> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);

    const query = `UPDATE bank_transfers SET ${fields} WHERE transfer_id = ?`;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query<ResultSetHeader>(query, [...values, transfer_id]);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  // 🗑 Delete bank transfer
  async deleteBankTransfer(transfer_id: number): Promise<boolean> {
    const query = `DELETE FROM bank_transfers WHERE transfer_id = ?`;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query<ResultSetHeader>(query, [transfer_id]);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }
}

export default new BankTransferService();
