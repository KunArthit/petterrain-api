import { ChatMessageModel } from "../models/ChatMessageModel";
import db from "@/core/database";

class ChatMessageService {
  // Get all chat messages
  async getAllMessages(): Promise<ChatMessageModel[]> {
    const query = `SELECT * FROM chat_messages;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ChatMessageModel[];
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      throw new Error("Failed to fetch chat messages");
    } finally {
      conn.release();
    }
  }

  // Get chat message by ID
  async getMessageById(message_id: number): Promise<ChatMessageModel | null> {
    const query = `SELECT * FROM chat_messages WHERE message_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [message_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch chat message:", error);
      throw new Error("Failed to fetch chat message");
    } finally {
      conn.release();
    }
  }

  // Get chat messages by session ID
  async getMessagesBySessionId(
    session_id: number
  ): Promise<ChatMessageModel[]> {
    const query = `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [session_id]);
      return rows as ChatMessageModel[];
    } catch (error) {
      console.error("Failed to fetch chat messages by session ID:", error);
      throw new Error("Failed to fetch chat messages by session ID");
    } finally {
      conn.release();
    }
  }

  // Create a new chat message
  async createMessage(
    message: Omit<ChatMessageModel, "message_id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO chat_messages (session_id, sender_type, sender_id, message_text, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        message.session_id,
        message.sender_type,
        message.sender_id,
        message.message_text,
        message.is_read,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create chat message:", error);
      throw new Error("Failed to create chat message");
    } finally {
      conn.release();
    }
  }

  // Update chat message (mark as read or edit text)
  async updateMessage(
    message_id: number,
    message: Partial<Omit<ChatMessageModel, "message_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE chat_messages
      SET session_id=?, sender_type=?, sender_id=?, message_text=?, is_read=?
      WHERE message_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        message.session_id,
        message.sender_type,
        message.sender_id,
        message.message_text,
        message.is_read,
        message_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update chat message:", error);
      throw new Error("Failed to update chat message");
    } finally {
      conn.release();
    }
  }

  // Delete chat message
  async deleteMessage(message_id: number): Promise<boolean> {
    const query = `DELETE FROM chat_messages WHERE message_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [message_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete chat message:", error);
      throw new Error("Failed to delete chat message");
    } finally {
      conn.release();
    }
  }
}

export default new ChatMessageService();
