import { InvoiceModel, InvoiceModelPrint } from "../models/InvoiceModel";
import db from "@/core/database";

class InvoiceService {
  // Get all invoices
  async getAllInvoices(): Promise<InvoiceModel[]> {
    const query = `SELECT * FROM invoices;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as InvoiceModel[];
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      throw new Error("Failed to fetch invoices");
    } finally {
      conn.release();
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoice_id: number): Promise<InvoiceModel | null> {
    const query = `SELECT * FROM invoices WHERE invoice_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [invoice_id]);
      return Array.isArray(rows) && rows.length
        ? (rows[0] as InvoiceModel)
        : null;
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      throw new Error("Failed to fetch invoice");
    } finally {
      conn.release();
    }
  }

  // Get invoices by Order ID
  // async getInvoicesByOrderId(order_id: number): Promise<InvoiceModel[]> {
  //   const query = `SELECT * FROM invoices WHERE order_id = ? ORDER BY invoice_date DESC;`;
  //   const conn = await db.getConnection();
  //   try {
  //     const [rows] = await conn.query(query, [order_id]);
  //     return rows as InvoiceModel[];
  //   } catch (error) {
  //     console.error("Failed to fetch invoices by order ID:", error);
  //     throw new Error("Failed to fetch invoices by order ID");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async getInvoicesByOrderId(order_id: number): Promise<InvoiceModel[]> {
    const query = `SELECT * FROM invoices WHERE order_id = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [order_id]);
      return rows as InvoiceModel[];
    } catch (error) {
      console.error("Failed to fetch invoices by order ID:", error);
      throw new Error("Failed to fetch invoices by order ID");
    } finally {
      conn.release();
    }
  }

  // Create a new invoice
  async createInvoice(
    invoice: Omit<InvoiceModel, "invoice_id" | "created_at">
  ): Promise<number> {
    const query = `
    INSERT INTO invoices (
        order_id, invoice_no, invoice_date, due_date, subtotal, tax_amount, 
        shipping_cost, total_amount, payment_status, notes, 
        address, sub_district, district, province, zipcode, country, phone_number, 
        customer_name, tracking, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
  `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        invoice.order_id,
        invoice.invoice_no,
        typeof invoice.invoice_date === "string"
          ? new Date(invoice.invoice_date)
          : invoice.invoice_date,
        typeof invoice.due_date === "string"
          ? new Date(invoice.due_date)
          : invoice.due_date,
        invoice.subtotal,
        invoice.tax_amount,
        invoice.shipping_cost,
        invoice.total_amount,
        invoice.payment_status,
        invoice.notes,
        invoice.address,
        invoice.sub_district,
        invoice.district,
        invoice.province,
        invoice.zipcode,
        invoice.country,
        invoice.phone_number,
        // --- เพิ่มฟิลด์ใหม่ที่นี่ ---
        invoice.customer_name,
        invoice.tracking,
        // ----------------------------
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw new Error("Failed to create invoice");
    } finally {
      conn.release();
    }
  }

  // Update invoice
  async updateInvoice(
    invoice_id: number,
    invoice: Partial<Omit<InvoiceModel, "invoice_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
    UPDATE invoices
    SET order_id=?, invoice_no=?, invoice_date=?, due_date=?, subtotal=?, tax_amount=?, 
        shipping_cost=?, total_amount=?, payment_status=?, notes=?,
        address=?, sub_district=?, district=?, province=?, zipcode=?, country=?, phone_number=?,
        customer_name=?, tracking=?
    WHERE invoice_id=?;
  `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        invoice.order_id,
        invoice.invoice_no,
        invoice.invoice_date,
        invoice.due_date,
        invoice.subtotal,
        invoice.tax_amount,
        invoice.shipping_cost,
        invoice.total_amount,
        invoice.payment_status,
        invoice.notes,
        invoice.address,
        invoice.sub_district,
        invoice.district,
        invoice.province,
        invoice.zipcode,
        invoice.phone_number,
        // --- เพิ่มฟิลด์ใหม่ที่นี่ ---
        invoice.customer_name,
        invoice.tracking,
        // ----------------------------
        invoice_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update invoice:", error);
      throw new Error("Failed to update invoice");
    } finally {
      conn.release();
    }
  }

  // Delete invoice
  async deleteInvoice(invoice_id: number): Promise<boolean> {
    const query = `DELETE FROM invoices WHERE invoice_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [invoice_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      throw new Error("Failed to delete invoice");
    } finally {
      conn.release();
    }
  }
}

export default new InvoiceService();
