import { ChatbotResponseModel } from "../models/ChatbotResponseModel";
import db from "@/core/database";

class ChatbotResponseService {
  // Get all chatbot responses
  async getAllResponses(): Promise<ChatbotResponseModel[]> {
    const query = `SELECT * FROM chatbot_responses;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ChatbotResponseModel[];
    } catch (error) {
      console.error("Failed to fetch chatbot responses:", error);
      throw new Error("Failed to fetch chatbot responses");
    } finally {
      conn.release();
    }
  }

  // Get chatbot response by ID
  async getResponseById(
    response_id: number
  ): Promise<ChatbotResponseModel | null> {
    const query = `SELECT * FROM chatbot_responses WHERE response_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [response_id]);
      return Array.isArray(rows) && rows.length
        ? (rows[0] as ChatbotResponseModel)
        : null;
    } catch (error) {
      console.error("Failed to fetch chatbot response:", error);
      throw new Error("Failed to fetch chatbot response");
    } finally {
      conn.release();
    }
  }

  // Get chatbot response by keyword
  async getResponseByKeyword(
    keyword: string
  ): Promise<ChatbotResponseModel | null> {
    const query = `SELECT * FROM chatbot_responses WHERE keyword = ? AND is_active = TRUE LIMIT 1;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [keyword]);
      const responseRows = rows as ChatbotResponseModel[];
      return responseRows.length ? responseRows[0] : null;
    } catch (error) {
      console.error("Failed to fetch chatbot response by keyword:", error);
      throw new Error("Failed to fetch chatbot response by keyword");
    } finally {
      conn.release();
    }
  }

  // Create a new chatbot response
  async createResponse(
    response: Omit<ChatbotResponseModel, "response_id">
  ): Promise<number> {
    const query = `INSERT INTO chatbot_responses (keyword, response_text, is_active) VALUES (?, ?, ?);`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        response.keyword,
        response.response_text,
        response.is_active,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create chatbot response:", error);
      throw new Error("Failed to create chatbot response");
    } finally {
      conn.release();
    }
  }

  // Update chatbot response
  async updateResponse(
    response_id: number,
    response: Partial<Omit<ChatbotResponseModel, "response_id">>
  ): Promise<boolean> {
    const query = `UPDATE chatbot_responses SET keyword=?, response_text=?, is_active=? WHERE response_id=?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        response.keyword,
        response.response_text,
        response.is_active,
        response_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update chatbot response:", error);
      throw new Error("Failed to update chatbot response");
    } finally {
      conn.release();
    }
  }

  // Delete chatbot response
  async deleteResponse(response_id: number): Promise<boolean> {
    const query = `DELETE FROM chatbot_responses WHERE response_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [response_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete chatbot response:", error);
      throw new Error("Failed to delete chatbot response");
    } finally {
      conn.release();
    }
  }
}

export default new ChatbotResponseService();
