import { BlogPostMediaModel } from "../models/BlogPostMediaModel";
import db from "@/core/database";

class BlogPostMediaService {
  // Get all media records
  async getAllMedia(): Promise<BlogPostMediaModel[]> {
    const query = `SELECT * FROM blog_post_media;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as BlogPostMediaModel[];
    } catch (error) {
      console.error("Failed to fetch media records:", error);
      throw new Error("Failed to fetch media records");
    } finally {
      conn.release();
    }
  }

  // Get media by ID
  async getMediaById(media_id: number): Promise<BlogPostMediaModel | null> {
    const query = `SELECT * FROM blog_post_media WHERE media_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [media_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch media record:", error);
      throw new Error("Failed to fetch media record");
    } finally {
      conn.release();
    }
  }

  // Get media by Post ID
  async getMediaByPostId(post_id: number): Promise<BlogPostMediaModel[]> {
    const query = `SELECT * FROM blog_post_media WHERE post_id = ? ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [post_id]);
      return rows as BlogPostMediaModel[];
    } catch (error) {
      console.error("Failed to fetch media by post ID:", error);
      throw new Error("Failed to fetch media by post ID");
    } finally {
      conn.release();
    }
  }

  // Create a new media record
  async createMedia(
    media: Omit<BlogPostMediaModel, "media_id">
  ): Promise<number> {
    const query = `
      INSERT INTO blog_post_media (post_id, media_type, media_url, caption, display_order)
      VALUES (?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.post_id,
        media.media_type,
        media.media_url,
        media.caption,
        media.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create media record:", error);
      throw new Error("Failed to create media record");
    } finally {
      conn.release();
    }
  }

  // Update media record
  async updateMedia(
    media_id: number,
    media: Partial<Omit<BlogPostMediaModel, "media_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE blog_post_media
      SET post_id=?, media_type=?, media_url=?, caption=?, display_order=?
      WHERE media_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.post_id,
        media.media_type,
        media.media_url,
        media.caption,
        media.display_order,
        media_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update media record:", error);
      throw new Error("Failed to update media record");
    } finally {
      conn.release();
    }
  }

  // Delete media record
  async deleteMedia(media_id: number): Promise<boolean> {
    const query = `DELETE FROM blog_post_media WHERE media_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [media_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete media record:", error);
      throw new Error("Failed to delete media record");
    } finally {
      conn.release();
    }
  }
}

export default new BlogPostMediaService();
