import { TicketResponseModel } from "../models/TicketResponseModel";
import db from "@/core/database";

class TicketResponseService {
  // Get all ticket responses
  async getAllResponses(): Promise<TicketResponseModel[]> {
    const query = `SELECT * FROM ticket_responses ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as TicketResponseModel[];
    } catch (error) {
      console.error("Failed to fetch ticket responses:", error);
      throw new Error("Failed to fetch ticket responses");
    } finally {
      conn.release();
    }
  }

  // Get ticket response by ID
  async getResponseById(
    response_id: number
  ): Promise<TicketResponseModel | null> {
    const query = `SELECT * FROM ticket_responses WHERE response_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [response_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch ticket response:", error);
      throw new Error("Failed to fetch ticket response");
    } finally {
      conn.release();
    }
  }

  // Get responses by Ticket ID
  async getResponsesByTicketId(
    ticket_id: number
  ): Promise<TicketResponseModel[]> {
    const query = `SELECT * FROM ticket_responses WHERE ticket_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [ticket_id]);
      return rows as TicketResponseModel[];
    } catch (error) {
      console.error("Failed to fetch responses by ticket ID:", error);
      throw new Error("Failed to fetch responses by ticket ID");
    } finally {
      conn.release();
    }
  }

  // Create a new ticket response
  async createResponse(
    response: Omit<TicketResponseModel, "response_id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO ticket_responses (ticket_id, user_id, response_text, created_at)
      VALUES (?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        response.ticket_id,
        response.user_id,
        response.response_text,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create ticket response:", error);
      throw new Error("Failed to create ticket response");
    } finally {
      conn.release();
    }
  }

  // Update ticket response
  async updateResponse(
    response_id: number,
    response: Partial<Omit<TicketResponseModel, "response_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE ticket_responses
      SET ticket_id=?, user_id=?, response_text=?
      WHERE response_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        response.ticket_id,
        response.user_id,
        response.response_text,
        response_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update ticket response:", error);
      throw new Error("Failed to update ticket response");
    } finally {
      conn.release();
    }
  }

  // Delete ticket response
  async deleteResponse(response_id: number): Promise<boolean> {
    const query = `DELETE FROM ticket_responses WHERE response_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [response_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete ticket response:", error);
      throw new Error("Failed to delete ticket response");
    } finally {
      conn.release();
    }
  }
}

export default new TicketResponseService();
