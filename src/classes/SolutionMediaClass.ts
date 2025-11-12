import db from "@/core/database";
import { CreateSolutionMedia, SolutionMedia } from "../models/SolutionMedia";

class SolutionMediaService {
  async createSolutionMedia(media: CreateSolutionMedia): Promise<number> {
    const query = `
      INSERT INTO solution_content_media (solution_content_id, media_type, media_url, caption, display_order)
      VALUES (?, ?, ?, ?, ?);
    `;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.solution_content_id,
        media.media_type,
        media.media_url,
        media.caption || null,
        media.display_order || 0,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create solution media:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getSolutionMediaById(mediaId: number): Promise<SolutionMedia | null> {
    const query = `SELECT * FROM solution_content_media WHERE media_id = ?`;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [mediaId]);
      const results = rows as SolutionMedia[];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Failed to get solution media:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getSolutionMediaByCategory(
    categoryId: number
  ): Promise<SolutionMedia[]> {
    const query = `
      SELECT * FROM solution_content_media 
      WHERE solution_content_id = ? 
      ORDER BY display_order ASC, created_at DESC
    `;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [categoryId]);
      return rows as SolutionMedia[];
    } catch (error) {
      console.error("Failed to get solution media by category:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async updateSolutionMedia(
    mediaId: number,
    updates: Partial<CreateSolutionMedia>
  ): Promise<boolean> {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const query = `UPDATE solution_content_media SET ${fields} WHERE media_id = ?`;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [...values, mediaId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update solution media:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async deleteSolutionMedia(mediaId: number): Promise<boolean> {
    const query = `DELETE FROM solution_content_media WHERE media_id = ?`;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [mediaId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete solution media:", error);
      throw error;
    } finally {
      conn.release();
    }
  }
}

export default SolutionMediaService;
