import { ServiceTicketModel } from "../models/ServiceTicketModel";
import db from "@/core/database";

class ServiceTicketService {
  // Get all service tickets
  async getAllTickets(): Promise<ServiceTicketModel[]> {
    const query = `SELECT * FROM service_tickets ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ServiceTicketModel[];
    } catch (error) {
      console.error("Failed to fetch service tickets:", error);
      throw new Error("Failed to fetch service tickets");
    } finally {
      conn.release();
    }
  }

  // Get service ticket by ID
  async getTicketById(ticket_id: number): Promise<ServiceTicketModel | null> {
    const query = `SELECT * FROM service_tickets WHERE ticket_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [ticket_id]);
      return Array.isArray(rows) && rows.length
        ? (rows[0] as ServiceTicketModel)
        : null;
    } catch (error) {
      console.error("Failed to fetch service ticket:", error);
      throw new Error("Failed to fetch service ticket");
    } finally {
      conn.release();
    }
  }

  // Get tickets by User ID
  async getTicketsByUserId(user_id: number): Promise<ServiceTicketModel[]> {
    const query = `SELECT * FROM service_tickets WHERE user_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as ServiceTicketModel[];
    } catch (error) {
      console.error("Failed to fetch tickets by user ID:", error);
      throw new Error("Failed to fetch tickets by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new service ticket
  async createTicket(
    ticket: Omit<ServiceTicketModel, "ticket_id" | "created_at" | "updated_at">
  ): Promise<number> {
    const query = `
      INSERT INTO service_tickets (user_id, subject, description, status, priority, assigned_to, created_at, updated_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        ticket.user_id,
        ticket.subject,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.assigned_to,
        ticket.resolved_at,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create service ticket:", error);
      throw new Error("Failed to create service ticket");
    } finally {
      conn.release();
    }
  }

  // Update service ticket
  async updateTicket(
    ticket_id: number,
    ticket: Partial<Omit<ServiceTicketModel, "ticket_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE service_tickets
      SET user_id=?, subject=?, description=?, status=?, priority=?, assigned_to=?, updated_at=NOW(), resolved_at=?
      WHERE ticket_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        ticket.user_id,
        ticket.subject,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.assigned_to,
        ticket.resolved_at,
        ticket_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update service ticket:", error);
      throw new Error("Failed to update service ticket");
    } finally {
      conn.release();
    }
  }

  // Delete service ticket
  async deleteTicket(ticket_id: number): Promise<boolean> {
    const query = `DELETE FROM service_tickets WHERE ticket_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [ticket_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete service ticket:", error);
      throw new Error("Failed to delete service ticket");
    } finally {
      conn.release();
    }
  }
}

export default new ServiceTicketService();
