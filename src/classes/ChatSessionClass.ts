import { ChatSessionModel } from "../models/ChatSessionModel";
import db from "@/core/database";

class ChatSessionService {
  // Get all chat sessions
  async getAllSessions(): Promise<ChatSessionModel[]> {
    const query = `SELECT * FROM chat_sessions;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ChatSessionModel[];
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      throw new Error("Failed to fetch chat sessions");
    } finally {
      conn.release();
    }
  }

  // Get chat session by ID
  async getSessionById(session_id: number): Promise<ChatSessionModel | null> {
    const query = `SELECT * FROM chat_sessions WHERE session_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [session_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch chat session:", error);
      throw new Error("Failed to fetch chat session");
    } finally {
      conn.release();
    }
  }

  // Get chat sessions by user ID
  async getSessionsByUserId(user_id: number): Promise<ChatSessionModel[]> {
    const query = `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as ChatSessionModel[];
    } catch (error) {
      console.error("Failed to fetch chat sessions by user ID:", error);
      throw new Error("Failed to fetch chat sessions by user ID");
    } finally {
      conn.release();
    }
  }

  // Create a new chat session
  async createSession(
    session: Omit<ChatSessionModel, "session_id" | "created_at" | "closed_at">
  ): Promise<number> {
    const query = `
      INSERT INTO chat_sessions (user_id, session_type, status, created_at)
      VALUES (?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        session.user_id,
        session.session_type,
        session.status,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      throw new Error("Failed to create chat session");
    } finally {
      conn.release();
    }
  }

  // Update chat session (status change or close)
  async updateSession(
    session_id: number,
    session: Partial<Omit<ChatSessionModel, "session_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE chat_sessions
      SET user_id=?, session_type=?, status=?, closed_at=?
      WHERE session_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        session.user_id,
        session.session_type,
        session.status,
        session.closed_at,
        session_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update chat session:", error);
      throw new Error("Failed to update chat session");
    } finally {
      conn.release();
    }
  }

  // Close chat session (set closed_at timestamp)
  async closeSession(session_id: number): Promise<boolean> {
    const query = `UPDATE chat_sessions SET status='closed', closed_at=NOW() WHERE session_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [session_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to close chat session:", error);
      throw new Error("Failed to close chat session");
    } finally {
      conn.release();
    }
  }

  // Delete chat session
  async deleteSession(session_id: number): Promise<boolean> {
    const query = `DELETE FROM chat_sessions WHERE session_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [session_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      throw new Error("Failed to delete chat session");
    } finally {
      conn.release();
    }
  }
}

export default new ChatSessionService();
