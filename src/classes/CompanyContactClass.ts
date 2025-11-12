import { CompanyContactModel } from "../models/CompanyContactModel";
import db from "@/core/database";

class CompanyContactService {
  // Get all company contacts
  async getAllContacts(): Promise<CompanyContactModel[]> {
    const query = `SELECT * FROM company_contacts ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as CompanyContactModel[];
    } catch (error) {
      console.error("Failed to fetch company contacts:", error);
      throw new Error("Failed to fetch company contacts");
    } finally {
      conn.release();
    }
  }

  // Get company contact by ID
  async getContactById(
    contact_id: number
  ): Promise<CompanyContactModel | null> {
    const query = `SELECT * FROM company_contacts WHERE contact_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [contact_id]);
      return Array.isArray(rows) && rows.length
        ? (rows[0] as CompanyContactModel)
        : null;
    } catch (error) {
      console.error("Failed to fetch company contact:", error);
      throw new Error("Failed to fetch company contact");
    } finally {
      conn.release();
    }
  }

  // Get contacts by Company User ID
  async getContactsByCompanyUserId(
    company_user_id: number
  ): Promise<CompanyContactModel[]> {
    const query = `SELECT * FROM company_contacts WHERE company_user_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [company_user_id]);
      return rows as CompanyContactModel[];
    } catch (error) {
      console.error("Failed to fetch contacts by company user ID:", error);
      throw new Error("Failed to fetch contacts by company user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new company contact
  async createContact(
    contact: Omit<CompanyContactModel, "contact_id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO company_contacts (company_user_id, contact_name, position, email, phone, is_primary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        contact.company_user_id,
        contact.contact_name,
        contact.position,
        contact.email,
        contact.phone,
        contact.is_primary,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create company contact:", error);
      throw new Error("Failed to create company contact");
    } finally {
      conn.release();
    }
  }

  // Update company contact
  async updateContact(
    contact_id: number,
    contact: Partial<Omit<CompanyContactModel, "contact_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE company_contacts
      SET company_user_id=?, contact_name=?, position=?, email=?, phone=?, is_primary=?
      WHERE contact_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        contact.company_user_id,
        contact.contact_name,
        contact.position,
        contact.email,
        contact.phone,
        contact.is_primary,
        contact_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update company contact:", error);
      throw new Error("Failed to update company contact");
    } finally {
      conn.release();
    }
  }

  // Delete company contact
  async deleteContact(contact_id: number): Promise<boolean> {
    const query = `DELETE FROM company_contacts WHERE contact_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [contact_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete company contact:", error);
      throw new Error("Failed to delete company contact");
    } finally {
      conn.release();
    }
  }
}

export default new CompanyContactService();
