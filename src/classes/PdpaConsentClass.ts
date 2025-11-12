import { PdpaConsentModel } from "../models/PdpaConsentModel";
import db from "@/core/database";

class PdpaConsentService {
  // Get all PDPA consents
  async getAllConsents(): Promise<PdpaConsentModel[]> {
    const query = `SELECT * FROM pdpa_consents;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as PdpaConsentModel[];
    } catch (error) {
      console.error("Failed to fetch PDPA consents:", error);
      throw new Error("Failed to fetch PDPA consents");
    } finally {
      conn.release();
    }
  }

  // Get PDPA consent by ID
  async getConsentById(consent_id: number): Promise<PdpaConsentModel | null> {
    const query = `SELECT * FROM pdpa_consents WHERE consent_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [consent_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch PDPA consent:", error);
      throw new Error("Failed to fetch PDPA consent");
    } finally {
      conn.release();
    }
  }

  // Get PDPA consents by user ID
  async getConsentsByUserId(user_id: number): Promise<PdpaConsentModel[]> {
    const query = `SELECT * FROM pdpa_consents WHERE user_id = ? ORDER BY consent_date DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as PdpaConsentModel[];
    } catch (error) {
      console.error("Failed to fetch PDPA consents by user ID:", error);
      throw new Error("Failed to fetch PDPA consents by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new PDPA consent
  async createConsent(
    consent: Omit<PdpaConsentModel, "consent_id" | "consent_date">
  ): Promise<number> {
    const query = `
      INSERT INTO pdpa_consents (user_id, ip_address, consent_text, consented, consent_date)
      VALUES (?, ?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        consent.user_id,
        consent.ip_address,
        consent.consent_text,
        consent.consented,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create PDPA consent:", error);
      throw new Error("Failed to create PDPA consent");
    } finally {
      conn.release();
    }
  }

  // Update PDPA consent
  async updateConsent(
    consent_id: number,
    consent: Partial<Omit<PdpaConsentModel, "consent_id" | "consent_date">>
  ): Promise<boolean> {
    const query = `
      UPDATE pdpa_consents
      SET user_id=?, ip_address=?, consent_text=?, consented=?
      WHERE consent_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        consent.user_id,
        consent.ip_address,
        consent.consent_text,
        consent.consented,
        consent_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update PDPA consent:", error);
      throw new Error("Failed to update PDPA consent");
    } finally {
      conn.release();
    }
  }

  // Delete PDPA consent
  async deleteConsent(consent_id: number): Promise<boolean> {
    const query = `DELETE FROM pdpa_consents WHERE consent_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [consent_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete PDPA consent:", error);
      throw new Error("Failed to delete PDPA consent");
    } finally {
      conn.release();
    }
  }
}

export default new PdpaConsentService();
